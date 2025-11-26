#!/usr/bin/env node

/**
 * This script waits for Vite to start, detects which port it's using,
 * then launches Electron with the correct URL
 */

const { exec } = require('child_process');
const http = require('http');

const possiblePorts = [5173, 5174, 5175, 5176, 5177];
let vitePort = null;

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findVitePort() {
  for (const port of possiblePorts) {
    const isRunning = await checkPort(port);
    if (isRunning) {
      return port;
    }
  }
  return null;
}

async function waitForVite(maxAttempts = 30, delayMs = 1000) {
  console.log('⏳ Waiting for Vite dev server to start...');
  
  for (let i = 0; i < maxAttempts; i++) {
    vitePort = await findVitePort();
    if (vitePort) {
      console.log(`✅ Vite dev server found on port ${vitePort}`);
      return vitePort;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('❌ Vite dev server did not start in time');
}

async function main() {
  try {
    const port = await waitForVite();
    
    console.log('📦 Building main process...');
    
    // Build the main process
    exec('npm run build:main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
      }
      
      console.log('🚀 Launching Electron...');
      
      // Launch Electron with the correct Vite URL
      const electronProcess = exec(
        `cross-env NODE_ENV=development VITE_DEV_SERVER_URL=http://localhost:${port} electron .`,
        (error, stdout, stderr) => {
          if (error && error.code !== null) {
            console.error('Electron error:', error);
          }
        }
      );
      
      // Pipe output
      electronProcess.stdout.pipe(process.stdout);
      electronProcess.stderr.pipe(process.stderr);
      
      // Handle exit
      electronProcess.on('exit', (code) => {
        console.log(`Electron exited with code ${code}`);
        process.exit(code);
      });
    });
    
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
