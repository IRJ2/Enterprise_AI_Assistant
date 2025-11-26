import React, { useState, useEffect } from 'react';
import { APIConfig } from '../types';

interface SettingsViewProps {
  onConfigsUpdate: () => void;
  activeConfigId: string | null;
}

interface CustomParam {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

const SettingsView: React.FC<SettingsViewProps> = ({ onConfigsUpdate, activeConfigId }) => {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const loadedConfigs = await window.electronAPI.getConfigs();
    setConfigs(loadedConfigs);
  };

  const handleNewConfig = () => {
    setEditingConfig({
      id: Date.now().toString(),
      providerName: '',
      baseUrl: '',
      apiKey: '',
      modelName: '',
      contextWindow: 4096,
      customParams: {},
    });
    setCustomParams([]);
    setShowForm(true);
  };

  const handleEditConfig = (config: APIConfig) => {
    setEditingConfig(config);
    
    // Convert customParams object to array for editing
    const paramsArray: CustomParam[] = Object.entries(config.customParams).map(
      ([key, value]) => ({
        key,
        value: String(value),
        type: typeof value as 'string' | 'number' | 'boolean',
      })
    );
    setCustomParams(paramsArray);
    setShowForm(true);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;

    // Validate required fields
    if (
      !editingConfig.providerName ||
      !editingConfig.baseUrl ||
      !editingConfig.apiKey ||
      !editingConfig.modelName
    ) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert customParams array back to object
    const customParamsObject: Record<string, any> = {};
    customParams.forEach(param => {
      if (param.key) {
        if (param.type === 'number') {
          customParamsObject[param.key] = parseFloat(param.value) || 0;
        } else if (param.type === 'boolean') {
          customParamsObject[param.key] = param.value === 'true';
        } else {
          customParamsObject[param.key] = param.value;
        }
      }
    });

    const configToSave: APIConfig = {
      ...editingConfig,
      customParams: customParamsObject,
    };

    await window.electronAPI.saveConfig(configToSave);
    setShowForm(false);
    setEditingConfig(null);
    setCustomParams([]);
    loadConfigs();
    onConfigsUpdate();
  };

  const handleDeleteConfig = async (configId: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      await window.electronAPI.deleteConfig(configId);
      loadConfigs();
      onConfigsUpdate();
    }
  };

  const handleSetActive = async (configId: string) => {
    await window.electronAPI.setActiveConfigId(configId);
    onConfigsUpdate();
  };

  const handleAddCustomParam = () => {
    setCustomParams([...customParams, { key: '', value: '', type: 'string' }]);
  };

  const handleRemoveCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  const handleCustomParamChange = (
    index: number,
    field: keyof CustomParam,
    value: string
  ) => {
    const updated = [...customParams];
    updated[index] = { ...updated[index], [field]: value };
    setCustomParams(updated);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">API Configurations</h2>
          <button
            onClick={handleNewConfig}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            + New Configuration
          </button>
        </div>

        {/* Configuration List */}
        {!showForm && (
          <div className="space-y-4">
            {configs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">No configurations yet</p>
                <button
                  onClick={handleNewConfig}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create your first configuration
                </button>
              </div>
            ) : (
              configs.map(config => (
                <div
                  key={config.id}
                  className={`bg-white rounded-lg border-2 p-6 ${
                    config.id === activeConfigId
                      ? 'border-primary-500'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        {config.providerName}
                        {config.id === activeConfigId && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{config.modelName}</p>
                    </div>
                    <div className="flex space-x-2">
                      {config.id !== activeConfigId && (
                        <button
                          onClick={() => handleSetActive(config.id)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleEditConfig(config)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Base URL:</span>
                      <p className="text-gray-800 break-all">{config.baseUrl}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">API Key:</span>
                      <p className="text-gray-800">••••••••</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Context Window:</span>
                      <p className="text-gray-800">{config.contextWindow}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Custom Parameters:</span>
                      <p className="text-gray-800">
                        {Object.keys(config.customParams).length} parameter(s)
                      </p>
                    </div>
                  </div>
                  {Object.keys(config.customParams).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Custom Parameters:</p>
                      <div className="space-y-1">
                        {Object.entries(config.customParams).map(([key, value]) => (
                          <div key={key} className="text-sm text-gray-600">
                            <code className="bg-gray-100 px-2 py-1 rounded">
                              {key}: {JSON.stringify(value)}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Configuration Form */}
        {showForm && editingConfig && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {configs.find(c => c.id === editingConfig.id)
                ? 'Edit Configuration'
                : 'New Configuration'}
            </h3>

            <div className="space-y-4">
              {/* Provider Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingConfig.providerName}
                  onChange={e =>
                    setEditingConfig({ ...editingConfig, providerName: e.target.value })
                  }
                  placeholder="e.g., Internal Qwen API, OpenAI GPT-5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingConfig.baseUrl}
                  onChange={e =>
                    setEditingConfig({ ...editingConfig, baseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={editingConfig.apiKey}
                  onChange={e =>
                    setEditingConfig({ ...editingConfig, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingConfig.modelName}
                  onChange={e =>
                    setEditingConfig({ ...editingConfig, modelName: e.target.value })
                  }
                  placeholder="e.g., Qwen2.5-Coder-32B-Instruct, gpt-5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Context Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Window
                </label>
                <input
                  type="number"
                  value={editingConfig.contextWindow}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      contextWindow: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="4096"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Custom Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Parameters
                  </label>
                  <button
                    onClick={handleAddCustomParam}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Parameter
                  </button>
                </div>
                <div className="space-y-2">
                  {customParams.map((param, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={param.key}
                        onChange={e =>
                          handleCustomParamChange(index, 'key', e.target.value)
                        }
                        placeholder="Parameter name (e.g., max_tokens)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <select
                        value={param.type}
                        onChange={e =>
                          handleCustomParamChange(
                            index,
                            'type',
                            e.target.value as 'string' | 'number' | 'boolean'
                          )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                      <input
                        type="text"
                        value={param.value}
                        onChange={e =>
                          handleCustomParamChange(index, 'value', e.target.value)
                        }
                        placeholder={
                          param.type === 'boolean'
                            ? 'true or false'
                            : param.type === 'number'
                            ? '0.7'
                            : 'Value'
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleRemoveCustomParam(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {customParams.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No custom parameters. Add parameters like temperature, max_tokens, etc.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                    setCustomParams([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
