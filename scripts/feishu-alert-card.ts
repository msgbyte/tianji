export default {
  async fetch(event, context) {
    const alerts = event.alerts;

    if (!Array.isArray(alerts) || !alerts.length) {
      throw new Error('Expected a Grafana payload with alerts');
    }
    if (!context.env.FEISHU_ALERT_WEBHOOK_URL) {
      throw new Error('Missing FEISHU_ALERT_WEBHOOK_URL');
    }

    const resolved = event.status === 'resolved';
    const status = resolved ? 'Resolved' : 'Firing';
    const title = event.commonLabels?.alertname || alerts[0].labels?.alertname || 'Grafana alert';
    const time = (value: string) =>
      new Date(value).toLocaleString('sv-SE', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
      });
    const field = (label: string, value: unknown) => {
      const text = String(value ?? '—').replace(/([\\*_`[\]<>])/g, '\\$1');

      return {
        is_short: true,
        text: {
          tag: 'lark_md',
          content: `<font color='grey'>${label}</font>\n**${text}**`,
        },
      };
    };

    const elements = alerts.flatMap((alert, index) => {
      const done = alert.status === 'resolved';
      const seconds = Math.max(
        0,
        Math.round((Date.parse(alert.endsAt) - Date.parse(alert.startsAt)) / 1000)
      );
      const duration = Number.isFinite(seconds)
        ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
        : '—';
      const metrics = Object.entries(alert.values || {})
        .map(([key, value]) => {
          let display = value;

          if (typeof value === 'number' && Number.isFinite(value)) {
            display =
              value !== 0 && Math.abs(value) < 0.01
                ? value.toExponential(1)
                : Number(value.toFixed(2));
          }

          return `${key} = ${display}`;
        })
        .join(' · ');

      const links = [
        ['View panel', alert.panelURL],
        ['Dashboard', alert.dashboardURL],
        ['Alert rule', alert.generatorURL],
        ...(!done ? [['Create silence', alert.silenceURL]] : []),
      ].filter(([, url]) => typeof url === 'string' && /^https?:\/\//i.test(url));

      return [
        ...(index ? [{ tag: 'hr' }] : []),
        ...(alerts.length > 1
          ? [
              {
                tag: 'div',
                text: {
                  tag: 'plain_text',
                  content: `${done ? '✅ Resolved' : '🚨 Firing'} · ${alert.labels?.alertname || title}`,
                },
              },
            ]
          : []),
        {
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: alert.annotations?.summary || event.commonAnnotations?.summary || title,
          },
        },
        {
          tag: 'div',
          fields: [
            field('Environment', alert.labels?.namespace || event.commonLabels?.namespace),
            field('Service', alert.labels?.grafana_folder || event.commonLabels?.grafana_folder),
          ],
        },
        {
          tag: 'div',
          fields: [
            field('Metrics', metrics || '—'),
            field('Duration', done ? duration : 'Ongoing'),
          ],
        },
        { tag: 'hr' },
        {
          tag: 'div',
          fields: [
            field('Started', time(alert.startsAt)),
            field('Resolved', done ? time(alert.endsAt) : '—'),
          ],
        },
        ...(links.length
          ? [
              {
                tag: 'action',
                actions: links.map(([label, url], i) => ({
                  tag: 'button',
                  text: { tag: 'plain_text', content: label },
                  type: i === 0 ? 'primary' : 'default',
                  url,
                })),
              },
            ]
          : []),
      ];
    });

    const response = await request({
      method: 'POST',
      url: context.env.FEISHU_ALERT_WEBHOOK_URL,
      timeout: 8000,
      data: {
        msg_type: 'interactive',
        card: {
          config: { wide_screen_mode: true },
          header: {
            template: resolved ? 'green' : 'red',
            title: {
              tag: 'plain_text',
              content: `${resolved ? '✅' : '🚨'} ${status} · ${title}`,
            },
          },
          elements: [
            ...elements,
            { tag: 'hr' },
            {
              tag: 'note',
              elements: [
                {
                  tag: 'plain_text',
                  content: `Grafana · ${event.receiver || 'Alert webhook'} · UTC+08:00${
                    event.truncatedAlerts
                      ? ` · ${event.truncatedAlerts} additional alerts omitted by Grafana`
                      : ''
                  }`,
                },
              ],
            },
          ],
        },
      },
    });

    const code = response.data?.code ?? response.data?.StatusCode;

    if (response.status < 200 || response.status >= 300 || code !== 0) {
      throw new Error(`Feishu rejected the card: ${code ?? response.status}`);
    }

    return { success: true };
  },
} satisfies TianjiWorker;
