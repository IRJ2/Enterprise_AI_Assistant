declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

export interface APIConfig {
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export {};
