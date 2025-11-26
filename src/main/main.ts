import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';

// Store for persisting configurations
const store = new Store();

let mainWindow: BrowserWindow | null = null;

interface APIConfig {
  id: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  contextWindow: number;
  customParams: Record<string, any>;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'Enterprise AI Assistant',
  });

  // Load the app
  // In dev mode, try to connect to Vite dev server for hot reload
  // Otherwise, load from built files (desktop app mode)
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Get all configurations
ipcMain.handle('get-configs', async () => {
  const configs = store.get('apiConfigs', []) as APIConfig[];
  return configs;
});

// Save configuration
ipcMain.handle('save-config', async (_, config: APIConfig) => {
  const configs = store.get('apiConfigs', []) as APIConfig[];
  const existingIndex = configs.findIndex(c => c.id === config.id);
  
  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    configs.push(config);
  }
  
  store.set('apiConfigs', configs);
  return { success: true };
});

// Delete configuration
ipcMain.handle('delete-config', async (_, configId: string) => {
  const configs = store.get('apiConfigs', []) as APIConfig[];
  const filteredConfigs = configs.filter(c => c.id !== configId);
  store.set('apiConfigs', filteredConfigs);
  return { success: true };
});

// Get active configuration ID
ipcMain.handle('get-active-config-id', async () => {
  return store.get('activeConfigId', null);
});

// Set active configuration ID
ipcMain.handle('set-active-config-id', async (_, configId: string) => {
  store.set('activeConfigId', configId);
  return { success: true };
});

// Send message to AI API
ipcMain.handle('send-message', async (_, message: string, configId: string) => {
  try {
    const configs = store.get('apiConfigs', []) as APIConfig[];
    const config = configs.find(c => c.id === configId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Build the request body
    const requestBody: any = {
      model: config.modelName,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      ...config.customParams,
    };

    // Make the API call
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    
    // Handle different response formats (OpenAI-like)
    let content = '';
    if (data.choices && data.choices[0]) {
      content = data.choices[0].message?.content || data.choices[0].text || '';
    } else if (data.response) {
      content = data.response;
    } else if (data.content) {
      content = data.content;
    } else {
      content = JSON.stringify(data);
    }

    return {
      success: true,
      content,
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
});

// Send streaming message to AI API
ipcMain.handle('send-message-stream', async (event, message: string, configId: string) => {
  try {
    const configs = store.get('apiConfigs', []) as APIConfig[];
    const config = configs.find(c => c.id === configId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Build the request body with streaming enabled
    const requestBody: any = {
      model: config.modelName,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      stream: true,
      ...config.customParams,
    };

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body reader not available');
    }

    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed: any = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                event.sender.send('message-stream-chunk', content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    event.sender.send('message-stream-end');
    return { success: true };
  } catch (error: any) {
    event.sender.send('message-stream-error', error.message);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
});
