# Enterprise Network Configuration Guide

This application now supports enterprise network configurations including private networks, VPNs, and custom SSL certificates.

## Features

### 1. **Custom SSL/TLS Certificates**
For internal APIs using self-signed or corporate CA certificates:

- **Custom CA Certificate Path**: Specify the path to your organization's CA certificate file (`.pem` or `.crt` format)
  ```
  Example: /etc/ssl/certs/company-ca.pem
  ```

### 2. **Ignore SSL Certificate Verification**
⚠️ **Use with caution** - Only for development/testing environments

- Enable this option to bypass SSL certificate validation
- Useful for self-signed certificates in development
- **NOT recommended for production use**

### 3. **Proxy Support**
For organizations requiring HTTP/HTTPS proxies:

- Configure your corporate proxy URL
  ```
  Example: http://proxy.company.com:8080
  ```

### 4. **Custom Headers**
Add custom headers for authentication or API requirements:

- Example use cases:
  - Additional authentication tokens
  - API versioning headers
  - Custom tracking headers

## Common Scenarios

### Scenario 1: Internal LLM Gateway (Private Network)
```
Provider Name: Internal Qwen Gateway
Base URL: https://llmgateway.company.build/v1/chat/completions
API Key: your-internal-api-key
Model Name: Qwen2.5-Coder-32B-Instruct

Enterprise Network Options:
☑ Ignore SSL Certificate Errors (if using self-signed cert)
OR
Custom CA Certificate Path: /path/to/company-ca.pem
```

### Scenario 2: Behind Corporate Proxy
```
Provider Name: OpenAI via Proxy
Base URL: https://api.openai.com/v1/chat/completions
API Key: sk-...
Model Name: gpt-4

Enterprise Network Options:
Proxy URL: http://proxy.company.com:8080
```

### Scenario 3: VPN-Only Access
1. Connect to your company VPN first
2. Configure the API endpoint as normal
3. If using custom certificates, specify the CA certificate path

## Troubleshooting

### DNS Lookup Failures (`ENOTFOUND`)
**Symptom**: Cannot reach `llmgateway.company.build`. DNS lookup failed.

**Solutions**:
1. Ensure you're connected to the company VPN
2. Verify the hostname is correct
3. Check your `/etc/hosts` file for manual DNS entries
4. Test connectivity: `ping llmgateway.company.build`

### SSL Certificate Errors
**Symptom**: `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or similar SSL errors

**Solutions**:
1. Specify the custom CA certificate path in settings
2. Temporarily enable "Ignore SSL Certificate Errors" for testing
3. Ensure the CA certificate file is in PEM format

### Connection Refused (`ECONNREFUSED`)
**Symptom**: Connection refused to the API endpoint

**Solutions**:
1. Verify the service is running
2. Check if the port is correct
3. Ensure firewall rules allow the connection
4. Verify VPN/network connectivity

### Timeout Errors (`ETIMEDOUT`)
**Symptom**: Connection timeout

**Solutions**:
1. Check network connectivity
2. Verify proxy configuration if applicable
3. Increase timeout settings (future feature)
4. Test with a simpler endpoint (e.g., httpbin.org)

## Security Best Practices

1. **Never disable SSL verification in production** - Use custom CA certificates instead
2. **Protect API keys** - They are stored encrypted on your local machine
3. **Use VPN** - For accessing internal resources
4. **Rotate credentials regularly** - Update API keys periodically
5. **Test first** - Use the "Test Connection" button (coming soon) before deploying

## Testing Your Configuration

You can test your configuration using `https://httpbin.org/post` as a test endpoint:

```
Provider Name: Test Configuration
Base URL: https://httpbin.org/post
API Key: test
Model Name: test
```

This will return the request details, confirming that the app is working correctly.

## Need Help?

If you're still experiencing issues:

1. Check the Electron console logs (View → Toggle Developer Tools)
2. Look for detailed error messages with error codes
3. Verify network connectivity: `curl -v https://your-api-endpoint.com`
4. Contact your IT team for network/certificate configuration

---

**Version**: 1.0.0  
**Last Updated**: December 2025
