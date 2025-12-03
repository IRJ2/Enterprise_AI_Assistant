import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface APIConfig {
  id: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  contextWindow: number;
  customParams: Record<string, any>;
}

export interface ElectronAPI {
  getConfigs: () => Promise<APIConfig[]>;
  saveConfig: (config: APIConfig) => Promise<{ success: boolean }>;
  deleteConfig: (configId: string) => Promise<{ success: boolean }>;
  getActiveConfigId: () => Promise<string | null>;
  setActiveConfigId: (configId: string) => Promise<{ success: boolean }>;
  sendMessage: (message: string, configId: string) => Promise<{
    success: boolean;
    content?: string;
    error?: string;
    raw?: any;
  }>;
  sendMessageStream: (message: string, configId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onStreamChunk: (callback: (chunk: string) => void) => void;
  onStreamEnd: (callback: () => void) => void;
  onStreamError: (callback: (error: string) => void) => void;
  removeStreamListeners: () => void;
  testConnection: (configId: string) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  listModels: (configId: string) => Promise<{
    success: boolean;
    models?: string[];
    error?: string;
  }>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getConfigs: () => ipcRenderer.invoke('get-configs'),
  saveConfig: (config: APIConfig) => ipcRenderer.invoke('save-config', config),
  deleteConfig: (configId: string) => ipcRenderer.invoke('delete-config', configId),
  getActiveConfigId: () => ipcRenderer.invoke('get-active-config-id'),
  setActiveConfigId: (configId: string) => ipcRenderer.invoke('set-active-config-id', configId),
  sendMessage: (message: string, configId: string) => 
    ipcRenderer.invoke('send-message', message, configId),
  sendMessageStream: (message: string, configId: string) =>
    ipcRenderer.invoke('send-message-stream', message, configId),
  onStreamChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('message-stream-chunk', (_, chunk) => callback(chunk));
  },
  onStreamEnd: (callback: () => void) => {
    ipcRenderer.on('message-stream-end', () => callback());
  },
  onStreamError: (callback: (error: string) => void) => {
    ipcRenderer.on('message-stream-error', (_, error) => callback(error));
  },
  removeStreamListeners: () => {
    ipcRenderer.removeAllListeners('message-stream-chunk');
    ipcRenderer.removeAllListeners('message-stream-end');
    ipcRenderer.removeAllListeners('message-stream-error');
  },
  testConnection: (configId: string) => ipcRenderer.invoke('test-connection', configId),
  listModels: (configId: string) => ipcRenderer.invoke('list-models', configId),
} as ElectronAPI);
