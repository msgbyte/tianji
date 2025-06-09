---
sidebar_position: 100
---

# Troubleshooting

This document collects common issues and their solutions that you may encounter when using Tianji.

## WebSocket Connection Issues

### Problem Description

When using HTTPS services, other functions work normally, but WebSocket service cannot connect properly, which manifests as:

- The connection status indicator in the bottom left corner shows gray
- Server page list shows counts but no actual content

### Root Cause

This issue is usually caused by improper WebSocket forwarding policies in reverse proxy software. In HTTPS environments, WebSocket connections require correct Cookie security policies.

### Solution

You can resolve this issue by setting the following environment variable:

```bash
AUTH_USE_SECURE_COOKIES=true
```

This setting forces the application to treat cookies passed by the browser as encrypted cookies, thereby resolving WebSocket connection issues.

#### Configuration Methods

**Docker Environment:**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**Direct Deployment:**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### Verification Steps

After configuration, restart the service and check:

1. The bottom left connection status indicator should show green
2. Server pages should display real-time data normally
3. WebSocket connections should be established properly in browser developer tools

---

*If you encounter other issues, feel free to submit an [Issue](https://github.com/msgbyte/tianji/issues) or contribute solutions to this documentation.* 
