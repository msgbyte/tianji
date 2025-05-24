---
sidebar_position: 2
---

# Push Monitor

Push Monitor is a monitoring method where your application actively sends heartbeat signals to **Tianji** instead of Tianji checking your service. This is particularly useful for monitoring background tasks, cron jobs, or services behind firewalls that cannot be accessed directly.

## How It Works

1. **Tianji** provides you with a unique push endpoint URL
2. Your application sends HTTP POST requests to this endpoint at regular intervals
3. If no heartbeat is received within the configured timeout period, Tianji triggers an alert

## Configuration

When creating a Push Monitor, you need to configure:

- **Monitor Name**: A descriptive name for your monitor
- **Timeout**: The maximum time (in seconds) to wait between heartbeats before considering the service down
- **Recommended Interval**: How often your application should send heartbeats (typically the same as timeout)

## Push Endpoint Format

```
POST https://tianji.example.com/api/push/{pushToken}
```

### Status Parameters

- **Normal Status**: Send without parameters or with `?status=up`
- **Down Status**: Send with `?status=down` to manually trigger an alert
- **Custom Message**: Add `&msg=your-message` to include additional information
- **Custom Value**: Add `&value=123` to track numeric values

## Examples

### Basic Heartbeat (cURL)

```bash
# Send heartbeat every 60 seconds
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// Send heartbeat every 60 seconds
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<your-push-token>', { 
      method: 'POST' 
    });
    console.log('Heartbeat sent successfully');
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def send_heartbeat():
    try:
        response = requests.post('https://tianji.example.com/api/push/<your-push-token>')
        print('Heartbeat sent successfully')
    except Exception as e:
        print(f'Failed to send heartbeat: {e}')

# Send heartbeat every 60 seconds
while True:
    send_heartbeat()
    time.sleep(60)
```

## Use Cases

### 1. Cron Jobs

Monitor the execution of scheduled tasks:

```bash
#!/bin/bash
# your-cron-job.sh

# Your actual job logic here
./run-backup.sh

# Send success signal
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. Background Services

Monitor long-running background processes:

```python
import requests
import time
import threading

class ServiceMonitor:
    def __init__(self, push_url):
        self.push_url = push_url
        self.running = True
        
    def start_heartbeat(self):
        def heartbeat_loop():
            while self.running:
                try:
                    requests.post(self.push_url)
                    time.sleep(30)  # Send every 30 seconds
                except Exception as e:
                    print(f"Heartbeat failed: {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# Usage
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# Your main service logic here
while True:
    # Do your work
    time.sleep(1)
```

### 3. Database Sync Jobs

Monitor data synchronization tasks:

```python
import requests
import schedule
import time

def sync_data():
    try:
        # Your data sync logic here
        result = perform_data_sync()
        
        if result.success:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'up', 'msg': f'synced-{result.records}-records'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'down', 'msg': 'sync-failed'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<your-push-token>',
            params={'status': 'down', 'msg': f'error-{str(e)}'}
        )

# Schedule to run every hour
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## Best Practices

1. **Set Appropriate Timeouts**: Configure timeout values based on your application's needs. For frequent tasks, use shorter timeouts. For periodic jobs, use longer timeouts.

2. **Handle Network Failures**: Implement retry logic in your heartbeat code to handle temporary network issues.

3. **Use Meaningful Messages**: Include descriptive messages with your heartbeats to provide context when reviewing logs.

4. **Monitor Critical Paths**: Place heartbeat calls at critical points in your application flow, not just at the beginning.

5. **Exception Handling**: Send a "down" status when an exception occurs in your application.

## Troubleshooting

### Common Issues

**No heartbeats received**:
- Verify the push token is correct
- Check network connectivity from your application to Tianji
- Ensure your application is actually running the heartbeat code

**Frequent false alarms**:
- Increase the timeout value
- Check if your application is experiencing performance issues
- Review network stability between your app and Tianji

**Missing heartbeats**:
- Add error handling and logging to your heartbeat code
- Consider implementing retry logic for failed requests
- Monitor your application's resource usage

## Security Considerations

- Keep your push tokens secure and don't expose them in public repositories
- Use HTTPS endpoints to encrypt data in transit
- Consider rotating push tokens periodically
- Limit the frequency of heartbeats to avoid overwhelming your Tianji instance

Push monitoring provides a reliable way to monitor services that traditional ping-based monitoring cannot reach, making it an essential tool for comprehensive infrastructure monitoring. 
