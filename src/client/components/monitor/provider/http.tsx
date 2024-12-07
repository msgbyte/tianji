import {
  Dropdown,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';
import React from 'react';
import { MonitorOverviewComponent, MonitorProvider } from './types';
import { trpc } from '../../../api/trpc';
import { MonitorStatsBlock } from '../MonitorStatsBlock';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { useCurrentWorkspaceId } from '../../../store/user';
import { z } from 'zod';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { LuArrowDown, LuChevronDown } from 'react-icons/lu';

const MonitorHttp: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const handleSetHeaderValue = useEvent((json: Record<string, string>) => {
    form.setFieldValue(['payload', 'headers'], JSON.stringify(json, null, 2));
  });

  return (
    <>
      <Form.Item
        label={t('Url')}
        name={['payload', 'url']}
        rules={[
          { required: true },
          {
            validator(rule, value, callback) {
              try {
                z.string().url().parse(value);
                callback();
              } catch (err) {
                callback('Not valid http url');
              }
            },
          },
        ]}
        tooltip={t(
          'For HTTPS monitoring, if any notification method is assigned, notifications will be sent at 1, 3, 7 and 14 days before expiration.'
        )}
      >
        <Input placeholder="https://example.com" />
      </Form.Item>

      <Form.Item
        label={t('Method')}
        name={['payload', 'method']}
        initialValue={'get'}
      >
        <Select>
          <Select.Option value="get">GET</Select.Option>
          <Select.Option value="post">POST</Select.Option>
          <Select.Option value="put">PUT</Select.Option>
          <Select.Option value="patch">PATCH</Select.Option>
          <Select.Option value="delete">DELETE</Select.Option>
          <Select.Option value="head">HEAD</Select.Option>
          <Select.Option value="options">OPTIONS</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label={t('Request Timeout(s)')} name={['payload', 'timeout']}>
        <InputNumber defaultValue={30} />
      </Form.Item>
      <Form.Item
        label={t('Ignore TLS/SSL error')}
        valuePropName="checked"
        name={['payload', 'ignoreTLS']}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="Content-Type"
        name={['payload', 'contentType']}
        initialValue={'application/json'}
      >
        <Select>
          <Select.Option value="application/json">
            application/json
          </Select.Option>
          <Select.Option value="application/x-www-form-urlencoded">
            application/x-www-form-urlencoded
          </Select.Option>
          <Select.Option value="text/xml; charset=utf-8">
            text/xml
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="Headers"
        name={['payload', 'headers']}
        rules={[
          {
            validator(rule, value, callback) {
              if (!value) {
                callback();
              }

              try {
                const obj = JSON.parse(value);
                if (typeof obj !== 'object') {
                  callback('Not JSON Object');
                } else {
                  callback();
                }
              } catch {
                callback('Not valid JSON string');
              }
            },
          },
        ]}
        extra={
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'default',
                  label: t('Default Fetch Headers'),
                  onClick: () =>
                    handleSetHeaderValue({
                      'Accept-Encoding': 'gzip, deflate, br, zstd',
                      'Accept-Language': 'en-US,en;q=0.9',
                      'Cache-Control': 'max-age=0',
                      Priority: 'u=0, i',
                      'Sec-Ch-Ua-Mobile': '?0',
                      'Sec-Ch-Ua-Platform': 'macOS',
                      'Sec-Fetch-Dest': 'document',
                      'Sec-Fetch-Mode': 'navigate',
                      'Sec-Fetch-Site': 'same-site',
                      'Sec-Fetch-User': '?1',
                      'Upgrade-Insecure-Requests': '1',
                      'User-Agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                    }),
                },
              ],
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="absolute -top-9 right-0"
              Icon={LuChevronDown}
              iconType="right"
            >
              {t('Preset')}
            </Button>
          </Dropdown>
        }
      >
        <Input.TextArea
          rows={4}
          placeholder='For example:&#13;&#10;{ "key": "value" }'
        />
      </Form.Item>
      <Form.Item
        label="Body"
        name={['payload', 'bodyValue']}
        rules={[
          {
            validator(rule, value, callback) {
              if (!value) {
                callback();
              }

              try {
                const obj = JSON.parse(value);
                if (typeof obj !== 'object') {
                  callback('Not JSON Object');
                } else {
                  callback();
                }
              } catch {
                callback('Not valid JSON string');
              }
            },
          },
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder='For example:&#13;&#10;{ "key": "value" }'
        />
      </Form.Item>
    </>
  );
});
MonitorHttp.displayName = 'MonitorHttp';

export const MonitorHttpOverview: MonitorOverviewComponent = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data } = trpc.monitor.getStatus.useQuery({
      workspaceId,
      monitorId: props.monitorId,
      statusName: 'tls',
    });

    if (!data || !data.payload || typeof data.payload !== 'object') {
      return null;
    }

    const payload = data.payload as Record<string, any>;

    if (isEmpty(payload.certInfo)) {
      return null;
    }

    return (
      <MonitorStatsBlock
        title={t('Cert Exp.')}
        tooltip={t(
          'For HTTPS monitoring, if any notification method is assigned, notifications will be sent at 1, 3, 7 and 14 days before expiration.'
        )}
        desc={dayjs(payload.certInfo?.validTo).format('YYYY-MM-DD')}
        text={t('{{num}} days', {
          num: payload.certInfo?.daysRemaining,
        })}
      />
    );
  }
);
MonitorHttpOverview.displayName = 'MonitorHttpOverview';

export const httpProvider: MonitorProvider = {
  label: 'HTTP',
  name: 'http',
  link: (info) => (
    <Typography.Link href={String(info.payload.url)} target="_blank">
      {String(info.payload.url)}
    </Typography.Link>
  ),
  form: MonitorHttp,
  overview: [MonitorHttpOverview],
};
