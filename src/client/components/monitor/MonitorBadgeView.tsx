import { Checkbox, Divider, Input, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { useEvent } from '../../hooks/useEvent';
import copy from 'copy-to-clipboard';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorBadgeView: React.FC<{
  workspaceId: string;
  monitorId: string;
  monitorName?: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { workspaceId, monitorId, monitorName = '' } = props;

  const [showDetail, setShowDetail] = useState(false);

  const url = useMemo(() => {
    let url = `${window.location.origin}/monitor/${workspaceId}/${monitorId}/badge.svg`;

    if (showDetail) {
      url += `?showDetail=true`;
    }

    return url;
  }, [showDetail]);

  const handleCopy = useEvent((text: string) => {
    copy(text);
    message.success(t('Copy success!'));
  });

  return (
    <div>
      <div>
        <img src={url} />
      </div>
      <p>{t('This will show your recent result of your monitor')}</p>
      <div>
        <Checkbox
          checked={showDetail}
          onChange={(e) => setShowDetail(e.target.checked)}
        >
          {t('Show Detail Number')}
        </Checkbox>
      </div>

      <Divider />

      <p>{t('Share with...')}</p>

      <div className="flex flex-col gap-2">
        <Input
          addonBefore="HTML Embed"
          value={`<img src="${url}" title="${monitorName}" />`}
          addonAfter={
            <div
              className="cursor-pointer"
              onClick={() =>
                handleCopy(`<img src="${url}" title="${monitorName}" />`)
              }
            >
              {t('Copy')}
            </div>
          }
        />

        <Input
          addonBefore="Markdown"
          value={`![${monitorName}](${url})`}
          addonAfter={
            <div
              className="cursor-pointer"
              onClick={() => handleCopy(`![${monitorName}](${url})`)}
            >
              {t('Copy')}
            </div>
          }
        />

        <Input
          addonBefore="BBCode"
          value={`[img]${url}[/img]`}
          addonAfter={
            <div
              className="cursor-pointer"
              onClick={() => handleCopy(`[img]${url}[/img]`)}
            >
              {t('Copy')}
            </div>
          }
        />

        <Input
          addonBefore="url"
          value={url}
          addonAfter={
            <div className="cursor-pointer" onClick={() => handleCopy(url)}>
              {t('Copy')}
            </div>
          }
        />
      </div>
    </div>
  );
});
MonitorBadgeView.displayName = 'MonitorBadgeView';
