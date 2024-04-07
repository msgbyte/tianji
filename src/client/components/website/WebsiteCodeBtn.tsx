import React from 'react';
import { Button } from '../ui/button';
import { LuCode2 } from 'react-icons/lu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { useTranslation } from '@i18next-toolkit/react';
import { Typography } from 'antd';
import { useGlobalConfig } from '@/hooks/useConfig';

interface WebsiteCodeBtnProps {
  websiteId: string;
}
export const WebsiteCodeBtn: React.FC<WebsiteCodeBtnProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { customTrackerScriptName = 'tracker.js' } = useGlobalConfig();

    const trackScript = `<script async defer src="${location.origin}/${customTrackerScriptName}" data-website-id="${props.websiteId}"></script>`;

    return (
      <Dialog>
        <DialogTrigger>
          <Button variant="outline" Icon={LuCode2}>
            {t('Code')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Tracking code')}</DialogTitle>
            <DialogDescription>
              {t('Add this code into your website head script')}
            </DialogDescription>
          </DialogHeader>

          <Typography.Paragraph
            copyable={{
              format: 'text/plain',
              text: trackScript,
            }}
            className="bg-muted flex h-[96px] overflow-auto rounded border border-black border-opacity-10 bg-opacity-5 p-2"
          >
            <span>{trackScript}</span>
          </Typography.Paragraph>
        </DialogContent>
      </Dialog>
    );
  }
);
WebsiteCodeBtn.displayName = 'WebsiteCodeBtn';
