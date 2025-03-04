---
sidebar_position: 2
---

# Server Status Page

You can create a server status page for user to show your server status to public which wanna make others know.

## Configure custom domain

You can config your status page in your own domain, for example: `status.example.com`

set it in page config, and create a `CNAME` record in your DNS dashboard.

```
CNAME status.example.com tianji.example.com
```

then you can visit custom `status.example.com` to your page.

### Troubleshooting

If you will throw 500 error, it looks like your Reverse Proxy is not configured correctly.

Please make sure your reverse proxy include your new status route.

for example:
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
