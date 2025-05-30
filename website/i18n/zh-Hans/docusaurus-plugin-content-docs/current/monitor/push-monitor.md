---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# Push 监控

Push 监控是一种监控方法，您的应用程序会主动向 **Tianji** 发送心跳信号，而不是由 Tianji 检查您的服务。这种方法对于监控后台任务、计划任务（cron jobs）或无法直接访问的防火墙后服务尤为有用。

## 工作原理

1. **Tianji** 为您提供一个唯一的推送端点 URL
2. 您的应用程序定期向该端点发送 HTTP POST 请求
3. 如果在配置的超时时间内未收到心跳信号，Tianji 会触发警报

## 配置

创建 Push 监控时，您需要配置：

- **监控名称**：用于描述监控项的名称
- **超时时间**：在心跳之间等待的最大时间（秒），超过此时间则认为服务已崩溃
- **推荐间隔**：您的应用程序应该发送心跳的频率（通常与超时时间相同）

## 推送端点格式

```
POST https://tianji.example.com/api/push/{pushToken}
```

### 状态参数

- **正常状态**：不带参数发送或使用 `?status=up` 发送
- **崩溃状态**：使用 `?status=down` 手动触发警报
- **自定义消息**：添加 `&msg=你的消息` 以包含附加信息
- **自定义数值**：添加 `&value=123` 以跟踪数值

## 示例

### 基本心跳（cURL）

```bash
# 每60秒发送一次心跳
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// 每60秒发送一次心跳
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

# 每60秒发送一次心跳
while True:
    send_heartbeat()
    time.sleep(60)
```

## 使用场景

### 1. 定时任务

监控计划任务的执行：

```bash
#!/bin/bash
# your-cron-job.sh

# 这里是您的实际作业逻辑
./run-backup.sh

# 发送成功信号
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. 后台服务

监控长时间运行的后台进程：

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
                    time.sleep(30)  # 每30秒发送一次
                except Exception as e:
                    print(f"Heartbeat failed: {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# 使用
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# 这里是您的主要服务逻辑
while True:
    # 执行您的工作
    time.sleep(1)
```

### 3. 数据库同步任务

监控数据同步任务：

```python
import requests
import schedule
import time

def sync_data():
    try:
        # 这里是您的数据同步逻辑
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

# 每小时运行一次
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## 最佳实践

1. **设置合适的超时时间**：根据应用程序的需求配置超时值。对于频繁任务，使用较短的超时时间。对于周期性任务，使用较长的超时时间。

2. **处理网络故障**：在您的心跳代码中实现重试逻辑，以处理临时网络问题。

3. **使用有意义的信息**：在心跳中包含描述性信息，以便在查看日志时提供上下文。

4. **监控关键路径**：在应用程序流程的关键点而不仅仅在开始时调用心跳。

5. **异常处理**：当应用程序出现异常时发送“down”状态。

## 故障排除

### 常见问题

**未收到心跳**：
- 确保推送令牌正确
- 检查从应用程序到 Tianji 的网络连接
- 确保您的应用程序确实在运行心跳代码

**频繁误报**：
- 增加超时值
- 检查应用程序是否经历性能问题
- 查看应用程序与 Tianji 之间的网络稳定性

**丢失心跳**：
- 添加错误处理和日志记录到心跳代码
- 考虑对失败请求实现重试逻辑
- 监控应用程序的资源使用

## 安全考虑

- 保持推送令牌的安全性，勿在公共存储库中公开
- 使用 HTTPS 端点加密传输中的数据
- 考虑定期更换推送令牌
- 限制心跳的频率以避免负载过大 Tianji 实例

Push 监控为无法通过传统 ping 方法进行监控的服务提供了一种可靠的监控方式，使其成为全面基础设施监控的重要工具。
