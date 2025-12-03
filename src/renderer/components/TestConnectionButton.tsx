import React, { useState } from 'react';

interface TestConnectionButtonProps {
  configId: string;
}

const TestConnectionButton: React.FC<TestConnectionButtonProps> = ({ configId }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    if (!configId) return;

    setTestStatus('testing');
    setTestMessage('');

    const result = await window.electronAPI.testConnection(configId);

    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message || 'Connection successful!');
    } else {
      setTestStatus('error');
      setTestMessage(result.error || 'Connection failed.');
    }

    // Reset after a few seconds
    setTimeout(() => {
      setTestStatus('idle');
      setTestMessage('');
    }, 5000);
  };

  const getButtonClass = () => {
    switch (testStatus) {
      case 'testing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div>
      <button
        onClick={handleTestConnection}
        disabled={testStatus === 'testing'}
        className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${getButtonClass()}`}
      >
        {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
      </button>
      {testMessage && (
        <p className={`mt-2 text-sm ${testStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {testMessage}
        </p>
      )}
    </div>
  );
};

export default TestConnectionButton;
