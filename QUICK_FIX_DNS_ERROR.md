# Quick Fix: DNS ENOTFOUND Error on Private Network

## Problem
You're connected to your private network but still getting:
```
Error: getaddrinfo ENOTFOUND llmgateway.company.build
```

## Solution Steps

### Option 1: Enable "Ignore SSL Certificate Errors" (Quickest)

1. Open the app
2. Go to **Settings**
3. Click **Edit** on your `llmgateway.company.build` configuration
4. Scroll down to **🔒 Enterprise Network Options**
5. Check ☑ **Ignore SSL Certificate Errors**
6. Click **Save Configuration**
7. Click the **Test** button to verify connection
8. Try sending a message

⚠️ This bypasses SSL verification - use only if your network uses self-signed certificates.

### Option 2: Check DNS Resolution (If Option 1 doesn't work)

Test if the hostname resolves:
```bash
ping llmgateway.company.build
```

If it fails, you may need to:

**Add to /etc/hosts file:**
```bash
sudo nano /etc/hosts
```

Add this line (replace with actual IP):
```
192.168.x.x  llmgateway.company.build
```

Save and test again.

### Option 3: Verify VPN/Network Connection

Make sure:
- ✓ VPN is fully connected
- ✓ You can access other internal resources
- ✓ Your network settings are correct

Test with curl:
```bash
curl -k https://llmgateway.company.build/v1/chat/completions
```

The `-k` flag ignores SSL errors (similar to the app's "Ignore SSL" option).

### Option 4: Use Custom CA Certificate (Most Secure)

If your company provides a CA certificate:

1. Download the CA certificate (`.pem` or `.crt` file)
2. Save it somewhere safe (e.g., `~/certs/company-ca.pem`)
3. In the app settings, under **Enterprise Network Options**
4. Set **Custom CA Certificate Path**: `/home/yourusername/certs/company-ca.pem`
5. Save and test

## Verification Steps

After applying any fix:

1. Click the **Test** button in Settings
2. You should see: ✓ **Connection successful!**
3. If successful, go to Chat tab
4. Send a test message
5. You should receive a response

## Still Not Working?

Check the terminal output for detailed error messages:
```bash
# Look for lines like:
⚠️  WARNING: SSL certificate verification is disabled
Fetch error details: ...
Error code: ENOTFOUND (DNS issue) or UNABLE_TO_VERIFY_LEAF_SIGNATURE (SSL issue)
```

### Common Issues:

**DNS still not working after VPN?**
- Wait 30 seconds for DNS to propagate
- Disconnect and reconnect VPN
- Restart the app: `npm run dev`

**Certificate issues?**
- Enable "Ignore SSL" temporarily to test
- Get the proper CA certificate from IT
- Use Option 4 for production

**Connection refused (ECONNREFUSED)?**
- Verify the port number in the URL
- Check if the service is running
- Ask your team for the correct endpoint

## Quick Test with httpbin.org

To verify the app is working correctly, create a test config:
```
Provider Name: Test
Base URL: https://httpbin.org/post
API Key: test
Model Name: test
```

This should work immediately and confirm the app itself is functioning.

---

**Need immediate help?** Enable "Ignore SSL Certificate Errors" in your config - it's the fastest way to test if SSL is the issue.
