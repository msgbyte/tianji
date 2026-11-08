import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settings';
import { languages } from '@/utils/i18n';
import { routeAuthBeforeLoad } from '@/utils/route';
import { setLanguage, useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Form, Select } from 'antd';

export const Route = createFileRoute('/settings/general')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t, i18n } = useTranslation();
  const alphaMode = useSettingsStore((state) => state.alphaMode);

  return (
    <CommonWrapper header={<CommonHeader title={t('Settings')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <Form layout="vertical">
            <Form.Item label={t('Language')} htmlFor="interface-language">
              <Select
                id="interface-language"
                className="w-full max-w-xs"
                value={i18n.language ?? 'en'}
                options={languages}
                fieldNames={{ value: 'key' }}
                onChange={setLanguage}
              />
            </Form.Item>

            <Form.Item
              label={t('Alpha Mode')}
              htmlFor="alpha-mode"
              extra={
                <span id="alpha-mode-description">
                  {t(
                    'Show experimental features that have not been fully tested, including Artifacts. This setting is saved in this browser.'
                  )}
                </span>
              }
            >
              <Switch
                id="alpha-mode"
                aria-describedby="alpha-mode-description"
                checked={alphaMode}
                onCheckedChange={(checked) =>
                  useSettingsStore.setState({ alphaMode: checked })
                }
              />
            </Form.Item>
          </Form>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
