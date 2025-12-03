# Debugging "fetch failed" Error

## Common Causes and Solutions

### 1. Invalid API URL
**Check:** Make sure your Base URL is correct
- Should end with the API endpoint path
- Example: `https://api.openai.com/v1/chat/completions`
- NOT just: `https://api.openai.com`

### 2. API Key Issues
**Check:** Verify your API key is valid
- Should start with `sk-` for OpenAI
- Make sure there are no extra spaces
- Check if the key has expired

### 3. Network/Firewall Issues
**Check:** Can your computer reach the API?
Test in terminal:
```bash
curl -X POST https://your-api-url/v1/chat/completions \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'
```

### 4. CORS/SSL Certificate Issues
**Check:** The API might have SSL certificate problems
- Try with a different API endpoint
- Check if the API requires specific headers

### 5. Model Name Mismatch
**Check:** Make sure the model name is correct
- OpenAI: `gpt-4`, `gpt-3.5-turbo`, `gpt-4-turbo-preview`
- Local APIs: Check your model's exact name

## How to Debug

### Step 1: Check the Console
1. Open DevTools (should be open in dev mode)
2. Look at the Console tab
3. You should see detailed error messages starting with:
   - "Sending request to:"
   - "Model:"
   - "Custom params:"
   - "Request body:"

### Step 2: Test with a Known Working API

**Option A: Use OpenAI (if you have an API key)**
```
Provider Name: OpenAI Test
Base URL: https://api.openai.com/v1/chat/completions
API Key: sk-your-actual-key-here
Model Name: gpt-3.5-turbo
Context Window: 4096
Custom Parameters: (leave empty or add temperature: 0.7)
```

**Option B: Use a Local Mock API**
First, install and run a mock server:
```bash
# Install json-server globally
npm install -g json-server

# Create a mock API file
echo '{"message": "Hello from mock API"}' > mock-api.json

# Run mock server
json-server --watch mock-api.json --port 3000
```

Then configure:
```
Provider Name: Local Mock
Base URL: http://localhost:3000/message
API Key: not-needed
Model Name: mock-model
Context Window: 4096
```

**Option C: Use a Public Test API**
```
Provider Name: HTTP Bin Test
Base URL: https://httpbin.org/post
API Key: not-needed
Model Name: test
Context Window: 4096
```
This will show you the full request being sent.

### Step 3: Check Electron Console Output

1. Stop the app (Ctrl+C in terminal)
2. Run again: `npm run dev`
3. Look for console.log messages in the terminal
4. Send a test message
5. Check what appears in the terminal

### Step 4: Verify Configuration Format

Your configuration should look like this in the app:
```json
{
  "id": "some-uuid",
  "providerName": "My API",
  "baseUrl": "https://api.example.com/v1/chat/completions",
  "apiKey": "your-key-here",
  "modelName": "model-name",
  "contextWindow": 4096,
  "customParams": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

## Quick Test Configuration

If you want to test without a real API, use this:

**Test with httpbin.org (shows what we're sending):**
1. Go to Settings
2. Create new configuration:
   - Provider Name: `Test HTTP Bin`
   - Base URL: `https://httpbin.org/post`
   - API Key: `test-key`
   - Model Name: `test-model`
   - Context Window: `4096`
3. Set as active
4. Go to Chat and send: "test"
5. Check the response - it will show you the entire request

## What to Look For in Console

When you send a message, you should see:
```
Sending request to: https://api.example.com/v1/chat/completions
Model: gpt-3.5-turbo
Custom params: { temperature: 0.7 }
Request body: {
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "hi"
    }
  ],
  "temperature": 0.7
}
```

If you see an error instead, it will tell you what went wrong.

## Common Error Messages

### "fetch failed"
- Network issue or invalid URL
- Check the URL format
- Test with curl command

### "Configuration not found"
- You didn't set an active configuration
- Go to Settings and click "Set Active"

### "API Error (401)"
- Invalid API key
- Check your API key is correct

### "API Error (404)"
- Wrong URL endpoint
- Check the Base URL path

### "API Error (429)"
- Rate limit exceeded
- Wait a moment and try again

### "Network error: getaddrinfo ENOTFOUND"
- DNS resolution failed
- Check your internet connection
- Verify the domain name is correct

## Need More Help?

1. Open DevTools (View → Toggle Developer Tools)
2. Go to Console tab
3. Send a message
4. Copy all the console output
5. Check what the error says

The detailed logging should now show you exactly what's going wrong!
