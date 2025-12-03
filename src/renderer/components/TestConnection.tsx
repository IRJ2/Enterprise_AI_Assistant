import React, { useState } from 'react';

interface TestConnectionProps {
  config: {
    baseUrl: string;
    apiKey: string;
    modelName: string;
    customParams: Record<string, any>;
  };
}

const TestConnection: React.FC<TestConnectionProps> = ({ config }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test with a simple ping message
      const response = await window.electronAPI.sendMessage(
        'Hello, this is a test message.',
        'test-config-id' // You'd pass the actual config ID
      );

      if (response.success) {
        setResult(`✅ Success! Response: ${response.content?.substring(0, 100)}...`);
      } else {
        setResult(`❌ Error: ${response.error}`);
      }
    } catch (error: any) {
      setResult(`❌ Exception: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-2">Test Connection</h4>
      <button
        onClick={testConnection}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {testing ? 'Testing...' : 'Test API Connection'}
      </button>
      {result && (
        <div className="mt-3 p-3 bg-white rounded border">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default TestConnection;
