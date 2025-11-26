# Enterprise AI Assistant

A cross-platform desktop application (Windows, macOS, Linux) that acts as an Enterprise AI Assistant/Chatbot with configurable API endpoints for various Large Language Models (LLMs).

## Features

- ✨ **Configurable API Endpoints**: Support for any OpenAI-compatible API
- 🔧 **Dynamic Custom Parameters**: Add custom key-value parameters for any LLM (temperature, max_tokens, etc.)
- 💬 **Chat Interface**: Clean, modern chat UI with message history
- 📝 **Markdown Support**: Full markdown rendering with syntax highlighting for code blocks
- 🌊 **Streaming Support**: Real-time streaming responses (optional)
- 💾 **Persistent Storage**: All configurations saved locally
- 🎨 **Modern UI**: Built with Tailwind CSS
- 🔒 **Secure**: Uses Electron's security best practices with context isolation

## Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks/Context API
- **Storage**: electron-store
- **Markdown**: react-markdown with syntax highlighting

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Quick Start (Desktop App)

To run the application as a **true desktop app** (no web server):

```bash
npm start
```

This will:
- Build the React frontend into static files
- Compile the TypeScript main process
- Launch the standalone Electron desktop application

### Development Mode with Hot Reload (Optional)

If you want hot-reload during development:

```bash
npm run dev
```

This will:
- Start the Vite dev server for the React frontend (port 5173)
- Launch the Electron app connected to the dev server
- Enable hot module replacement for faster development

### Building for Production

To build the application:

```bash
npm run build
```

To package the application for distribution:

```bash
npm run package
```

This will create distributables in the `out` folder.

## Usage Guide

### 1. Configure Your API

1. Click the **Settings** button in the header
2. Click **+ New Configuration**
3. Fill in the required fields:
   - **Provider Name**: A friendly name (e.g., "Internal Qwen API", "OpenAI GPT-5")
   - **Base URL**: Your API endpoint (e.g., `https://api.openai.com/v1/chat/completions`)
   - **API Key**: Your authentication key
   - **Model Name**: The model identifier (e.g., `Qwen2.5-Coder-32B-Instruct`, `gpt-4`)
   - **Context Window**: Maximum context size (e.g., `4096`)

4. **Add Custom Parameters** (Optional):
   - Click "+ Add Parameter"
   - Enter parameter name (e.g., `temperature`, `max_tokens`, `top_p`)
   - Select type (String, Number, Boolean)
   - Enter the value
   - You can add as many custom parameters as needed

5. Click **Save Configuration**

6. Click **Set Active** to make this configuration active for chat

### 2. Start Chatting

1. Click the **Chat** button in the header
2. Type your message in the text area
3. Press **Enter** to send (Shift+Enter for new line)
4. View the AI's response with full markdown formatting

### 3. Streaming Toggle

- Enable/disable **Enable Streaming** checkbox to switch between streaming and non-streaming responses
- Streaming shows responses token-by-token as they arrive
- Non-streaming waits for the complete response

### 4. Managing Configurations

- **Edit**: Modify existing configurations
- **Delete**: Remove configurations
- **Set Active**: Switch between different API configurations
- The active configuration is highlighted with a blue border

## API Compatibility

This application is designed to work with OpenAI-compatible APIs. The expected response format is:

```json
{
  "choices": [
    {
      "message": {
        "content": "Response text here"
      }
    }
  ]
}
```

For streaming, it expects Server-Sent Events (SSE) format with:

```
data: {"choices":[{"delta":{"content":"token"}}]}
```

## Project Structure

```
enterprise-ai-assistant/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main process entry point
│   │   └── preload.ts     # Preload script for secure IPC
│   └── renderer/          # React frontend
│       ├── components/    # React components
│       │   ├── ChatView.tsx
│       │   ├── SettingsView.tsx
│       │   └── MessageBubble.tsx
│       ├── App.tsx        # Main app component
│       ├── main.tsx       # React entry point
│       ├── types.ts       # TypeScript types
│       ├── index.css      # Global styles
│       └── index.html     # HTML template
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json          # TypeScript config for renderer
├── tsconfig.main.json     # TypeScript config for main
├── vite.config.ts         # Vite config
└── tailwind.config.js     # Tailwind CSS config
```

## Security

This application implements Electron security best practices:

- **Context Isolation**: Enabled to separate main and renderer processes
- **Preload Script**: Uses `contextBridge` to expose only necessary APIs
- **No Node Integration**: Renderer process doesn't have direct access to Node.js
- **Secure IPC**: All communication uses Electron's IPC with proper validation

## Troubleshooting

### API Connection Issues

- Verify the Base URL is correct and accessible
- Check that the API Key is valid
- Ensure the API endpoint follows OpenAI-compatible format
- Check DevTools Console for detailed error messages

### Streaming Not Working

- Verify your API supports Server-Sent Events (SSE)
- Try disabling streaming if your API doesn't support it
- Check network tab in DevTools for response format

### Application Won't Start

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm start
```

## Customization

### Adding New Features

The codebase is structured for easy extension:

- **Add new IPC handlers**: Edit `src/main/main.ts`
- **Add new React components**: Create in `src/renderer/components/`
- **Modify styles**: Edit `src/renderer/index.css` or use Tailwind classes
- **Change theme colors**: Edit `tailwind.config.js`

### Supporting Different API Formats

To support APIs with different response formats, modify the response parsing logic in `src/main/main.ts` in the `send-message` and `send-message-stream` handlers.

## License

MIT

## Support

For issues or questions, please check:
- The DevTools console for error messages
- The Terminal output for build errors
- API documentation for your specific LLM provider

---

**Built with ❤️ using Electron, React, and TypeScript**
