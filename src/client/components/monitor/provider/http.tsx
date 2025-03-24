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
        label={t('Valid Status Codes')}
        name={['payload', 'validStatusCodes']}
        tooltip={t(
          'HTTP status codes that are considered valid for this monitor. Default is 200-299.'
        )}
        initialValue={[]}
      >
        <Select
          mode="multiple"
          placeholder={t('Select valid status codes')}
          optionFilterProp="children"
        >
          <Select.OptGroup label={t('1xx Informational')}>
            <Select.Option value={100}>100 - {t('Continue')}</Select.Option>
            <Select.Option value={101}>
              101 - {t('Switching Protocols')}
            </Select.Option>
            <Select.Option value={102}>102 - {t('Processing')}</Select.Option>
            <Select.Option value={103}>103 - {t('Early Hints')}</Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label={t('2xx Success')}>
            <Select.Option value={200}>200 - {t('OK')}</Select.Option>
            <Select.Option value={201}>201 - {t('Created')}</Select.Option>
            <Select.Option value={202}>202 - {t('Accepted')}</Select.Option>
            <Select.Option value={203}>
              203 - {t('Non-Authoritative Information')}
            </Select.Option>
            <Select.Option value={204}>204 - {t('No Content')}</Select.Option>
            <Select.Option value={205}>
              205 - {t('Reset Content')}
            </Select.Option>
            <Select.Option value={206}>
              206 - {t('Partial Content')}
            </Select.Option>
            <Select.Option value={207}>207 - {t('Multi-Status')}</Select.Option>
            <Select.Option value={208}>
              208 - {t('Already Reported')}
            </Select.Option>
            <Select.Option value={226}>226 - {t('IM Used')}</Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label={t('3xx Redirection')}>
            <Select.Option value={300}>
              300 - {t('Multiple Choices')}
            </Select.Option>
            <Select.Option value={301}>
              301 - {t('Moved Permanently')}
            </Select.Option>
            <Select.Option value={302}>302 - {t('Found')}</Select.Option>
            <Select.Option value={303}>303 - {t('See Other')}</Select.Option>
            <Select.Option value={304}>304 - {t('Not Modified')}</Select.Option>
            <Select.Option value={305}>305 - {t('Use Proxy')}</Select.Option>
            <Select.Option value={307}>
              307 - {t('Temporary Redirect')}
            </Select.Option>
            <Select.Option value={308}>
              308 - {t('Permanent Redirect')}
            </Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label={t('4xx Client Errors')}>
            <Select.Option value={400}>400 - {t('Bad Request')}</Select.Option>
            <Select.Option value={401}>401 - {t('Unauthorized')}</Select.Option>
            <Select.Option value={402}>
              402 - {t('Payment Required')}
            </Select.Option>
            <Select.Option value={403}>403 - {t('Forbidden')}</Select.Option>
            <Select.Option value={404}>404 - {t('Not Found')}</Select.Option>
            <Select.Option value={405}>
              405 - {t('Method Not Allowed')}
            </Select.Option>
            <Select.Option value={406}>
              406 - {t('Not Acceptable')}
            </Select.Option>
            <Select.Option value={407}>
              407 - {t('Proxy Authentication Required')}
            </Select.Option>
            <Select.Option value={408}>
              408 - {t('Request Timeout')}
            </Select.Option>
            <Select.Option value={409}>409 - {t('Conflict')}</Select.Option>
            <Select.Option value={410}>410 - {t('Gone')}</Select.Option>
            <Select.Option value={411}>
              411 - {t('Length Required')}
            </Select.Option>
            <Select.Option value={412}>
              412 - {t('Precondition Failed')}
            </Select.Option>
            <Select.Option value={413}>
              413 - {t('Payload Too Large')}
            </Select.Option>
            <Select.Option value={414}>414 - {t('URI Too Long')}</Select.Option>
            <Select.Option value={415}>
              415 - {t('Unsupported Media Type')}
            </Select.Option>
            <Select.Option value={416}>
              416 - {t('Range Not Satisfiable')}
            </Select.Option>
            <Select.Option value={417}>
              417 - {t('Expectation Failed')}
            </Select.Option>
            <Select.Option value={418}>418 - {t("I'm a teapot")}</Select.Option>
            <Select.Option value={421}>
              421 - {t('Misdirected Request')}
            </Select.Option>
            <Select.Option value={422}>
              422 - {t('Unprocessable Entity')}
            </Select.Option>
            <Select.Option value={423}>423 - {t('Locked')}</Select.Option>
            <Select.Option value={424}>
              424 - {t('Failed Dependency')}
            </Select.Option>
            <Select.Option value={425}>425 - {t('Too Early')}</Select.Option>
            <Select.Option value={426}>
              426 - {t('Upgrade Required')}
            </Select.Option>
            <Select.Option value={428}>
              428 - {t('Precondition Required')}
            </Select.Option>
            <Select.Option value={429}>
              429 - {t('Too Many Requests')}
            </Select.Option>
            <Select.Option value={431}>
              431 - {t('Request Header Fields Too Large')}
            </Select.Option>
            <Select.Option value={451}>
              451 - {t('Unavailable For Legal Reasons')}
            </Select.Option>
          </Select.OptGroup>
          <Select.OptGroup label={t('5xx Server Errors')}>
            <Select.Option value={500}>
              500 - {t('Internal Server Error')}
            </Select.Option>
            <Select.Option value={501}>
              501 - {t('Not Implemented')}
            </Select.Option>
            <Select.Option value={502}>502 - {t('Bad Gateway')}</Select.Option>
            <Select.Option value={503}>
              503 - {t('Service Unavailable')}
            </Select.Option>
            <Select.Option value={504}>
              504 - {t('Gateway Timeout')}
            </Select.Option>
            <Select.Option value={505}>
              505 - {t('HTTP Version Not Supported')}
            </Select.Option>
            <Select.Option value={506}>
              506 - {t('Variant Also Negotiates')}
            </Select.Option>
            <Select.Option value={507}>
              507 - {t('Insufficient Storage')}
            </Select.Option>
            <Select.Option value={508}>
              508 - {t('Loop Detected')}
            </Select.Option>
            <Select.Option value={510}>510 - {t('Not Extended')}</Select.Option>
            <Select.Option value={511}>
              511 - {t('Network Authentication Required')}
            </Select.Option>
          </Select.OptGroup>
        </Select>
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
