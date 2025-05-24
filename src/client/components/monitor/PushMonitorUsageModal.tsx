import { AppRouterOutput, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { Modal, Typography } from 'antd';
import React from 'react';
import { CodeExample } from '../CodeExample';

const { Text } = Typography;

type MonitorInfo = AppRouterOutput['monitor']['get'];

interface PushMonitorUsageModalProps {
  monitorId: string;
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const PushMonitorUsageModal: React.FC<PushMonitorUsageModalProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { monitorId, open, onChangeOpen } = props;
    const { data: monitorInfo } = trpc.monitor.get.useQuery({
      workspaceId,
      monitorId,
    });
    const { t } = useTranslation();
    const timeout = monitorInfo?.payload.timeout || 60;

    const { pushBaseUrl, normalExamples, downExamples } =
      useExampleCode(monitorInfo);

    return (
      <Modal
        title={t('Push Monitoring Usage')}
        open={open}
        onCancel={() => onChangeOpen(false)}
        onOk={() => onChangeOpen(false)}
        destroyOnClose={true}
        centered={true}
        width={800}
        className="push-monitor-usage-modal"
      >
        <div className="space-y-4">
          <div className="text-sm">
            <p className="mb-2">
              {t(
                'Send HTTP requests to the following endpoint to indicate service health:'
              )}
            </p>
            <Text code copyable className="block rounded">
              {pushBaseUrl}
            </Text>
          </div>

          <div className="text-sm">
            <p className="mb-2">{t('Configuration:')}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {t('Recommended interval')}: {timeout}s
              </li>
              <li>
                {t('Timeout threshold')}: {timeout}s
              </li>
              <li>{t('Down status parameter')}: ?status=down</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium text-green-600">
                {t('Normal Status (Heartbeat)')}
              </h4>
              <CodeExample example={normalExamples} />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-red-600">
                {t('Down Status (Alert)')}
              </h4>
              <CodeExample example={downExamples} />
            </div>
          </div>

          <div className="border-t pt-3 text-xs text-gray-500">
            <p>
              {t(
                '💡 Tip: Choose the programming language that best fits your application stack. The monitor will trigger an alert if no heartbeat is received within the configured timeout period.'
              )}
            </p>
          </div>
        </div>
      </Modal>
    );
  });

PushMonitorUsageModal.displayName = 'PushMonitorUsageModal';

function useExampleCode(monitorInfo: MonitorInfo | undefined | null) {
  const pushBaseUrl = `${window.location.origin}/api/push/${monitorInfo?.payload.pushToken}`;
  const pushUpUrl = `${pushBaseUrl}?status=up&msg=ok&value=`;
  const pushDownUrl = `${pushBaseUrl}?status=down`;
  const timeout = monitorInfo?.payload.timeout || 60;

  const getCodeExamples = () => {
    const examples = {
      curl: {
        label: 'cURL',
        normal: `# Send heartbeat every ${timeout} seconds
while true; do
  curl -X POST "${pushUpUrl}"
  sleep ${timeout}
done`,
        down: `# Send down status
curl -X POST "${pushDownUrl}"`,
      },
      bash: {
        label: 'Bash',
        normal: `#!/bin/bash
# Send heartbeat every ${timeout} seconds
while true; do
  wget --quiet --output-document=/dev/null "${pushUpUrl}"
  sleep ${timeout}
done`,
        down: `#!/bin/bash
# Send down status
wget --quiet --output-document=/dev/null "${pushDownUrl}"`,
      },
      javascript: {
        label: 'JavaScript',
        normal: `// Send heartbeat every ${timeout} seconds
setInterval(async () => {
  try {
    await fetch('${pushUpUrl}', { method: 'POST' });
    console.log('Heartbeat sent successfully');
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}, ${timeout * 1000});`,
        down: `// Send down status
try {
  await fetch('${pushDownUrl}', { method: 'POST' });
  console.log('Down status sent');
} catch (error) {
  console.error('Failed to send down status:', error);
}`,
      },
      typescript: {
        label: 'TypeScript',
        normal: `// Send heartbeat every ${timeout} seconds
const sendHeartbeat = async (): Promise<void> => {
  try {
    const response = await fetch('${pushUpUrl}', { method: 'POST' });
    if (response.ok) {
      console.log('Heartbeat sent successfully');
    }
  } catch (error: unknown) {
    console.error('Failed to send heartbeat:', error);
  }
};

setInterval(sendHeartbeat, ${timeout * 1000});`,
        down: `// Send down status
const sendDownStatus = async (): Promise<void> => {
  try {
    const response = await fetch('${pushDownUrl}', { method: 'POST' });
    if (response.ok) {
      console.log('Down status sent');
    }
  } catch (error: unknown) {
    console.error('Failed to send down status:', error);
  }
};

await sendDownStatus();`,
      },
      python: {
        label: 'Python',
        normal: `import requests
import time

# Send heartbeat every ${timeout} seconds
while True:
    try:
        response = requests.post('${pushUpUrl}')
        print('Heartbeat sent successfully')
    except Exception as e:
        print(f'Failed to send heartbeat: {e}')

    time.sleep(${timeout})`,
        down: `import requests

# Send down status
try:
    response = requests.post('${pushDownUrl}')
    print('Down status sent')
except Exception as e:
    print(f'Failed to send down status: {e}')`,
      },
      php: {
        label: 'PHP',
        normal: `<?php
// Send heartbeat every ${timeout} seconds
while (true) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, '${pushUpUrl}');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $result = curl_exec($ch);
    curl_close($ch);

    echo "Heartbeat sent successfully\\n";
    sleep(${timeout});
}
?>`,
        down: `<?php
// Send down status
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${pushDownUrl}');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
curl_close($ch);

echo "Down status sent\\n";
?>`,
      },
      java: {
        label: 'Java',
        normal: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;

public class PushMonitor {
    private static final String PUSH_URL = "${pushUpUrl}";
    private static final int INTERVAL = ${timeout};

    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();

        while (true) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PUSH_URL))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(30))
                    .build();

                HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString());

                System.out.println("Heartbeat sent successfully");
                Thread.sleep(INTERVAL * 1000);
            } catch (Exception e) {
                System.err.println("Failed to send heartbeat: " + e.getMessage());
            }
        }
    }
}`,
        down: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;

// Send down status
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${pushDownUrl}"))
    .POST(HttpRequest.BodyPublishers.noBody())
    .timeout(Duration.ofSeconds(30))
    .build();

try {
    HttpResponse<String> response = client.send(request,
        HttpResponse.BodyHandlers.ofString());
    System.out.println("Down status sent");
} catch (Exception e) {
    System.err.println("Failed to send down status: " + e.getMessage());
}`,
      },
      go: {
        label: 'Go',
        normal: `package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    pushURL := "${pushUpUrl}"
    interval := ${timeout} * time.Second

    for {
        resp, err := http.Post(pushURL, "", nil)
        if err != nil {
            fmt.Printf("Failed to send heartbeat: %v\\n", err)
        } else {
            resp.Body.Close()
            fmt.Println("Heartbeat sent successfully")
        }

        time.Sleep(interval)
    }
}`,
        down: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    pushURL := "${pushDownUrl}"

    resp, err := http.Post(pushURL, "", nil)
    if err != nil {
        fmt.Printf("Failed to send down status: %v\\n", err)
    } else {
        resp.Body.Close()
        fmt.Println("Down status sent")
    }
}`,
      },
      csharp: {
        label: 'C#',
        normal: `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    private static readonly HttpClient client = new HttpClient();
    private static readonly string pushUrl = "${pushUpUrl}";
    private static readonly int interval = ${timeout * 1000};

    static async Task Main(string[] args)
    {
        while (true)
        {
            try
            {
                var response = await client.PostAsync(pushUrl, null);
                Console.WriteLine("Heartbeat sent successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send heartbeat: {ex.Message}");
            }

            await Task.Delay(interval);
        }
    }
}`,
        down: `using System;
using System.Net.Http;
using System.Threading.Tasks;

// Send down status
var client = new HttpClient();
try
{
    var response = await client.PostAsync("${pushDownUrl}", null);
    Console.WriteLine("Down status sent");
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to send down status: {ex.Message}");
}`,
      },
      powershell: {
        label: 'PowerShell',
        normal: `# Send heartbeat every ${timeout} seconds
while ($true) {
    try {
        Invoke-RestMethod -Uri "${pushUpUrl}" -Method Post
        Write-Host "Heartbeat sent successfully"
    }
    catch {
        Write-Error "Failed to send heartbeat: $_"
    }

    Start-Sleep -Seconds ${timeout}
}`,
        down: `# Send down status
try {
    Invoke-RestMethod -Uri "${pushDownUrl}" -Method Post
    Write-Host "Down status sent"
}
catch {
    Write-Error "Failed to send down status: $_"
}`,
      },
      docker: {
        label: 'Docker',
        normal: `# Dockerfile
FROM alpine:latest
RUN apk add --no-cache curl
COPY heartbeat.sh /heartbeat.sh
RUN chmod +x /heartbeat.sh
CMD ["/heartbeat.sh"]

# heartbeat.sh
#!/bin/sh
while true; do
  curl -X POST "${pushUpUrl}"
  sleep ${timeout}
done`,
        down: `# Send down status in Docker
docker run --rm alpine:latest sh -c "
  apk add --no-cache curl &&
  curl -X POST '${pushDownUrl}'
"`,
      },
    };

    return examples;
  };

  const examples = getCodeExamples();

  // Create normal status examples
  const normalExamples = Object.entries(examples).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        label: value.label,
        code: value.normal,
      };
      return acc;
    },
    {} as Record<string, { label: string; code: string }>
  );

  // Create down status examples
  const downExamples = Object.entries(examples).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        label: value.label,
        code: value.down,
      };
      return acc;
    },
    {} as Record<string, { label: string; code: string }>
  );

  return { pushBaseUrl, normalExamples, downExamples };
}
