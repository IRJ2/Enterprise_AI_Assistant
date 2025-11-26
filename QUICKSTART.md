# Quick Start Guide - Enterprise AI Assistant

## Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies including:
- Electron (desktop framework)
- React (UI framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- electron-store (persistent storage)
- react-markdown (markdown rendering)
- And all other required packages

**Note**: This may take a few minutes depending on your internet connection.

## Step 2: Start the Application

Once installation is complete, start the desktop application:

```bash
npm start
```

This command will:
1. Build the React frontend into static files
2. Compile the TypeScript main process files
3. Launch the Electron **desktop application** (no web server needed)

The application window will open as a **standalone desktop app**. If you're developing and want hot-reload, you can use `npm run dev` instead.

**Note**: The first `npm start` may take a minute as it builds everything. Subsequent starts will be faster.

## Step 3: Configure Your First API

1. Click the **Settings** button in the top-right corner
2. Click **+ New Configuration**
3. Fill in your API details:

   **Example for OpenAI:**
   - Provider Name: `OpenAI GPT-4`
   - Base URL: `https://api.openai.com/v1/chat/completions`
   - API Key: `sk-your-api-key-here`
   - Model Name: `gpt-4`
   - Context Window: `8192`
   
   **Example for Custom/Local API:**
   - Provider Name: `Local Qwen Model`
   - Base URL: `http://localhost:8000/v1/chat/completions`
   - API Key: `dummy-key` (if not required)
   - Model Name: `Qwen2.5-Coder-32B-Instruct`
   - Context Window: `4096`

4. (Optional) Add custom parameters:
   - Click **+ Add Parameter**
   - Example: `temperature` (Number) = `0.7`
   - Example: `max_tokens` (Number) = `1024`
   - Example: `top_p` (Number) = `0.9`

5. Click **Save Configuration**
6. Click **Set Active** to activate this configuration

## Step 4: Start Chatting

1. Click the **Chat** button in the top-right corner
2. Type a message in the text area at the bottom
3. Press **Enter** to send (or click the send button)
4. Wait for the AI's response

## Features to Try

### Streaming Mode
- Toggle the **Enable Streaming** checkbox
- With streaming ON: See responses appear word-by-word
- With streaming OFF: Wait for complete response

### Markdown Rendering
Try sending:
```
Explain what is markdown and show examples of:
- Bold and italic text
- Code blocks
- Lists
- Tables
```

### Multiple Configurations
- Create multiple API configurations for different models
- Switch between them in Settings with "Set Active"
- Each configuration can have different custom parameters

### Clear Chat
- Click **Clear Chat** button to start a fresh conversation

## Troubleshooting

### Port Already in Use
If you see "Port 5173 is already in use":
```bash
# Kill the process using port 5173
pkill -f "vite"
# Or on Windows:
# taskkill /F /IM node.exe
```

### Installation Errors
If npm install fails:
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Application Won't Start
1. Check that Node.js version is 18 or higher:
   ```bash
   node --version
   ```
2. Make sure all dependencies installed successfully
3. Check the terminal for error messages

### API Connection Issues
- Verify your API endpoint is accessible
- Test with curl:
  ```bash
  curl -X POST https://your-api-url/v1/chat/completions \
    -H "Authorization: Bearer your-api-key" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
  ```
- Check DevTools Console (View → Toggle Developer Tools) for detailed errors

### Streaming Not Working
- Some APIs don't support streaming
- Disable "Enable Streaming" checkbox and try non-streaming mode
- Check your API documentation for SSE support

## Building for Production

When you're ready to create a distributable version:

```bash
# Build the application
npm run build

# Package it (creates installers/executables)
npm run package
```

The packaged application will be in the `out` folder.

## Next Steps

1. **Explore Different Models**: Try different LLM providers and models
2. **Customize Parameters**: Experiment with temperature, top_p, max_tokens, etc.
3. **Save Conversations**: The app maintains chat history during your session
4. **Test with Local Models**: Use with locally-hosted LLMs like Ollama, LM Studio, etc.

## Getting Help

- Check the main README.md for detailed documentation
- Look at the code comments in `src/main/main.ts` and component files
- Open DevTools (Ctrl+Shift+I / Cmd+Option+I) to see console logs
- Check the terminal output for build/runtime errors

---

Enjoy using your Enterprise AI Assistant! 🚀
