import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as https from 'https';
import * as fs from 'fs';
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
  // Enterprise network options
  ignoreSsl?: boolean;
  customHeaders?: Record<string, string>;
  proxyUrl?: string;
  caCertPath?: string;
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

    console.log('=== API Request Debug Info ===');
    console.log('Config ID:', configId);
    console.log('Provider:', config.providerName);
    console.log('Base URL:', config.baseUrl);
    console.log('Model:', config.modelName);
    console.log('Custom params:', config.customParams);

    // Validate URL
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      throw new Error('API Base URL is empty. Please configure a valid URL in Settings.');
    }

    // Check if URL is valid
    try {
      new URL(config.baseUrl);
    } catch (urlError) {
      throw new Error(`Invalid API URL: "${config.baseUrl}". Please ensure it includes the protocol (e.g., https://)`);
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

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Configure fetch options for enterprise networks
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders, // Add custom headers
      },
      body: JSON.stringify(requestBody),
    };

    // Add custom agent for SSL/TLS and proxy support
    if (config.ignoreSsl || config.caCertPath || config.proxyUrl) {
      const agentOptions: any = {};

      // Disable SSL verification if requested (for self-signed certs in dev)
      if (config.ignoreSsl) {
        console.log('⚠️  WARNING: SSL certificate verification is disabled');
        agentOptions.rejectUnauthorized = false;
      }

      // Load custom CA certificate if provided
      if (config.caCertPath && fs.existsSync(config.caCertPath)) {
        console.log('Loading custom CA certificate from:', config.caCertPath);
        agentOptions.ca = fs.readFileSync(config.caCertPath);
      }

      fetchOptions.agent = new https.Agent(agentOptions);
    }

    // Make the API call
    const response = await fetch(config.baseUrl, fetchOptions).catch((fetchError: any) => {
      console.error('Fetch error details:', fetchError);
      console.error('Error code:', fetchError.code);
      console.error('Error cause:', fetchError.cause);
      
      let errorMessage = `Network error: ${fetchError.message}`;
      
      if (fetchError.cause) {
        errorMessage += `\nCause: ${fetchError.cause.message || fetchError.cause}`;
      }
      
      if (fetchError.code === 'ENOTFOUND') {
        errorMessage = `Cannot reach ${config.baseUrl}. DNS lookup failed. Please check the URL.`;
      } else if (fetchError.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused to ${config.baseUrl}. Is the server running?`;
      } else if (fetchError.code === 'ETIMEDOUT') {
        errorMessage = `Connection to ${config.baseUrl} timed out.`;
      }
      
      throw new Error(errorMessage);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    console.log('API Response:', data);
    
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
    console.error('Send message error:', error);
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

    console.log('=== Streaming API Request Debug Info ===');
    console.log('Config ID:', configId);
    console.log('Provider:', config.providerName);
    console.log('Base URL:', config.baseUrl);
    console.log('Model:', config.modelName);

    // Validate URL
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      throw new Error('API Base URL is empty. Please configure a valid URL in Settings.');
    }

    // Check if URL is valid
    try {
      new URL(config.baseUrl);
    } catch (urlError) {
      throw new Error(`Invalid API URL: "${config.baseUrl}". Please ensure it includes the protocol (e.g., https://)`);
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

    // Configure fetch options for enterprise networks
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders, // Add custom headers
      },
      body: JSON.stringify(requestBody),
    };

    // Add custom agent for SSL/TLS and proxy support
    if (config.ignoreSsl || config.caCertPath || config.proxyUrl) {
      const agentOptions: any = {};

      // Disable SSL verification if requested
      if (config.ignoreSsl) {
        console.log('⚠️  WARNING: SSL certificate verification is disabled');
        agentOptions.rejectUnauthorized = false;
      }

      // Load custom CA certificate if provided
      if (config.caCertPath && fs.existsSync(config.caCertPath)) {
        console.log('Loading custom CA certificate from:', config.caCertPath);
        agentOptions.ca = fs.readFileSync(config.caCertPath);
      }

      fetchOptions.agent = new https.Agent(agentOptions);
    }

    const response = await fetch(config.baseUrl, fetchOptions).catch((fetchError: any) => {
      console.error('Streaming fetch error details:', fetchError);
      console.error('Error code:', fetchError.code);
      
      let errorMessage = `Network error: ${fetchError.message}`;
      
      if (fetchError.cause) {
        errorMessage += `\nCause: ${fetchError.cause.message || fetchError.cause}`;
      }
      
      if (fetchError.code === 'ENOTFOUND') {
        errorMessage = `Cannot reach ${config.baseUrl}. DNS lookup failed. Please check the URL.`;
      } else if (fetchError.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused to ${config.baseUrl}. Is the server running?`;
      } else if (fetchError.code === 'ETIMEDOUT') {
        errorMessage = `Connection to ${config.baseUrl} timed out.`;
      }
      
      throw new Error(errorMessage);
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

// Test connection
ipcMain.handle('test-connection', async (_, configId: string) => {
  try {
    const configs = store.get('apiConfigs', []) as APIConfig[];
    const config = configs.find(c => c.id === configId);

    if (!config) {
      throw new Error('Configuration not found');
    }

    console.log('=== Testing Connection ===');
    console.log('URL:', config.baseUrl);
    console.log('Ignore SSL:', config.ignoreSsl);

    // Build a simple test request
    const testBody = {
      model: config.modelName,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    };

    // Configure fetch options for enterprise networks
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify(testBody),
    };

    // Add custom agent for SSL/TLS support
    if (config.ignoreSsl || config.caCertPath) {
      const agentOptions: any = {};

      if (config.ignoreSsl) {
        console.log('⚠️  Test: SSL verification disabled');
        agentOptions.rejectUnauthorized = false;
      }

      if (config.caCertPath && fs.existsSync(config.caCertPath)) {
        console.log('Test: Loading CA certificate from:', config.caCertPath);
        agentOptions.ca = fs.readFileSync(config.caCertPath);
      }

      fetchOptions.agent = new https.Agent(agentOptions);
    }

    const response = await fetch(config.baseUrl, fetchOptions).catch((fetchError: any) => {
      console.error('Test connection fetch error:', fetchError);
      
      let errorMessage = `Network error: ${fetchError.message}`;
      
      if (fetchError.code === 'ENOTFOUND') {
        errorMessage = `Cannot reach ${config.baseUrl}. DNS lookup failed. Check URL or VPN connection.`;
      } else if (fetchError.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused. Is the server running at ${config.baseUrl}?`;
      } else if (fetchError.code === 'ETIMEDOUT') {
        errorMessage = `Connection timeout. Server may be slow or unreachable.`;
      } else if (fetchError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || fetchError.message.includes('certificate')) {
        errorMessage = `SSL Certificate error. Enable "Ignore SSL" in settings or add custom CA certificate.`;
      }
      
      throw new Error(errorMessage);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Test connection API error:', response.status, errorText);
      
      let errorMessage = `API Error (${response.status})`;
      
      if (response.status === 404) {
        errorMessage = `404 Not Found. Check if the URL is correct. Expected format: https://host/v1/chat/completions`;
      } else if (response.status === 401) {
        errorMessage = `401 Unauthorized. Check your API key.`;
      } else if (response.status === 403) {
        errorMessage = `403 Forbidden. Check your API key and permissions.`;
      } else if (response.status === 400) {
        // Parse the error to give helpful feedback
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.includes('model')) {
            errorMessage = `400 Invalid Model. The model "${config.modelName}" doesn't exist on this server. Try listing available models or check with your team.`;
          } else {
            errorMessage = `400 Bad Request: ${errorData.error || errorText}`;
          }
        } catch {
          errorMessage = `400 Bad Request: ${errorText.substring(0, 200)}`;
        }
      } else if (response.status === 500) {
        errorMessage = `500 Server Error. The API server encountered an error.`;
      } else {
        errorMessage += `: ${errorText.substring(0, 200)}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Test connection successful:', data);

    return { success: true, message: 'Connection successful! API is responding correctly.' };
  } catch (error: any) {
    console.error('Test connection error:', error);
    return { success: false, error: error.message };
  }
});

// List available models
ipcMain.handle('list-models', async (_, configId: string) => {
  try {
    const configs = store.get('apiConfigs', []) as APIConfig[];
    const config = configs.find(c => c.id === configId);

    if (!config) {
      throw new Error('Configuration not found');
    }

    // Try to get models from /v1/models endpoint (OpenAI-compatible)
    const modelsUrl = config.baseUrl.replace('/chat/completions', '/models').replace('/v1/v1', '/v1');
    
    console.log('=== Listing Models ===');
    console.log('Models URL:', modelsUrl);

    const fetchOptions: any = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
    };

    // Add SSL support
    if (config.ignoreSsl || config.caCertPath) {
      const agentOptions: any = {};
      if (config.ignoreSsl) {
        agentOptions.rejectUnauthorized = false;
      }
      if (config.caCertPath && fs.existsSync(config.caCertPath)) {
        agentOptions.ca = fs.readFileSync(config.caCertPath);
      }
      fetchOptions.agent = new https.Agent(agentOptions);
    }

    const response = await fetch(modelsUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`Cannot list models (${response.status}). Your API might not support the /v1/models endpoint. Please check with your team for available model names.`);
    }

    const data: any = await response.json();
    console.log('Models response:', data);

    // Extract model names from response
    let models: string[] = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map((m: any) => m.id || m.name || m.model).filter(Boolean);
    } else if (data.models && Array.isArray(data.models)) {
      models = data.models;
    } else if (Array.isArray(data)) {
      models = data;
    }

    return { success: true, models };
  } catch (error: any) {
    console.error('List models error:', error);
    return { 
      success: false, 
      error: error.message,
      models: [] 
    };
  }
});
