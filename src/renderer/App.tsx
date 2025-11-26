import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';
import { APIConfig } from './types';

type ViewType = 'chat' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<APIConfig[]>([]);

  useEffect(() => {
    loadConfigs();
    loadActiveConfig();
  }, []);

  const loadConfigs = async () => {
    try {
      const loadedConfigs = await window.electronAPI.getConfigs();
      setConfigs(loadedConfigs);
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const loadActiveConfig = async () => {
    try {
      const configId = await window.electronAPI.getActiveConfigId();
      setActiveConfigId(configId);
    } catch (error) {
      console.error('Failed to load active config:', error);
    }
  };

  const handleConfigsUpdate = () => {
    loadConfigs();
    loadActiveConfig();
  };

  const activeConfig = configs.find(c => c.id === activeConfigId);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Enterprise AI Assistant</h1>
          {activeConfig && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {activeConfig.providerName} - {activeConfig.modelName}
            </span>
          )}
        </div>
        <nav className="flex space-x-2">
          <button
            onClick={() => setCurrentView('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'chat'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Settings
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'chat' ? (
          <ChatView activeConfigId={activeConfigId} />
        ) : (
          <SettingsView
            onConfigsUpdate={handleConfigsUpdate}
            activeConfigId={activeConfigId}
          />
        )}
      </main>
    </div>
  );
};

export default App;
