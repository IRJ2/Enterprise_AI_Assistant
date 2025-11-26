import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatViewProps {
  activeConfigId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ activeConfigId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [useStreaming, setUseStreaming] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    // Setup streaming listeners
    window.electronAPI.onStreamChunk((chunk: string) => {
      setStreamingContent(prev => prev + chunk);
    });

    window.electronAPI.onStreamEnd(() => {
      setStreamingContent(prev => {
        if (prev) {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: prev,
            timestamp: new Date(),
          };
          setMessages(msgs => [...msgs, assistantMessage]);
        }
        return '';
      });
      setIsLoading(false);
    });

    window.electronAPI.onStreamError((error: string) => {
      setError(error);
      setStreamingContent('');
      setIsLoading(false);
    });

    return () => {
      window.electronAPI.removeStreamListeners();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!activeConfigId) {
      setError('Please select an API configuration in Settings first.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setStreamingContent('');

    try {
      if (useStreaming) {
        // Use streaming API
        const result = await window.electronAPI.sendMessageStream(
          inputValue,
          activeConfigId
        );

        if (!result.success && result.error) {
          setError(result.error);
          setIsLoading(false);
        }
      } else {
        // Use non-streaming API
        const result = await window.electronAPI.sendMessage(
          inputValue,
          activeConfigId
        );

        setIsLoading(false);

        if (result.success && result.content) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.content,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError('Failed to send message. Please check your configuration.');
      console.error('Send message error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-2">
                {activeConfigId
                  ? 'Type a message below to get started'
                  : 'Please configure an API endpoint in Settings first'}
              </p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
            isStreaming={true}
          />
        )}

        {isLoading && !streamingContent && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-2 mb-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded"
            />
            <span>Enable Streaming</span>
          </label>
          <button
            onClick={handleClearChat}
            className="ml-auto text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
          >
            Clear Chat
          </button>
        </div>
        <div className="flex space-x-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              activeConfigId
                ? 'Type your message... (Press Enter to send, Shift+Enter for new line)'
                : 'Please configure an API endpoint in Settings first'
            }
            disabled={!activeConfigId || isLoading}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={!activeConfigId || !inputValue.trim() || isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
