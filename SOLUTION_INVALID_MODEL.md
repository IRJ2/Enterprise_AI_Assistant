# SOLVED: Invalid Model Name Error

## ✅ Success! Your API is Working

The error `{"error":"Invalid model name"}` means:
- ✅ Network connection: Working
- ✅ SSL/TLS: Working  
- ✅ Authentication: Working
- ✅ API endpoint: Correct
- ❌ Model name: Invalid

## 🎯 Quick Fix

You need to update the **Model Name** in your configuration. The model you specified doesn't exist on your internal LLM gateway.

### Option 1: Ask Your Team (Recommended)

Contact your team and ask:
> "What model names are available on our internal LLM gateway at `llmgateway.company.build`?"

Common internal model names might be:
- `qwen2.5-coder-32b-instruct`
- `qwen-32b`
- `llama-3-70b`
- `gpt-3.5-turbo` (if proxying to OpenAI)

### Option 2: Common Model Name Formats

Try these common variations in your Settings:

1. **Lowercase with hyphens:**
   ```
   qwen2.5-coder-32b-instruct
   ```

2. **Without version:**
   ```
   qwen-coder
   ```

3. **Just the base name:**
   ```
   qwen
   ```

4. **With underscores:**
   ```
   qwen2_5_coder_32b_instruct
   ```

### Option 3: Check API Documentation

If your team has documentation for the LLM gateway, look for:
- Available models list
- Model naming convention
- Example API requests

## 📝 How to Update Model Name

1. Open the app
2. Go to **Settings**
3. Click **Edit** on your configuration
4. Change the **Model Name** field
5. Click **Save Configuration**
6. Click **Test** to verify
7. If you see ✓ "Connection successful!" - you're ready to chat!

## 🔍 Testing Different Models

Try each model name one at a time:

1. Edit configuration
2. Update Model Name
3. Save
4. Click **Test**
5. Check the result:
   - ✓ Green = Success! Use this model
   - ✗ Red with "Invalid model" = Try another name

## Example Configuration

```
Provider Name: Internal LLM Gateway
Base URL: https://llmgateway.company.build/v1/chat/completions
API Key: your-api-key
Model Name: qwen2.5-coder-32b-instruct  ← UPDATE THIS
Context Window: 32768

Enterprise Network Options:
☑ Ignore SSL Certificate Errors
```

## 🎉 Almost There!

Your setup is correct - you just need the right model name. Once you have it, everything will work perfectly!

---

**Next Step**: Ask your team for the correct model name, update it in Settings, and start chatting! 🚀
