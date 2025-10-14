import { useTranslation } from '@i18next-toolkit/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuCopy, LuExternalLink } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import React from 'react';

interface ShortLinkCardProps {
  code: string;
  originalUrl: string;
  title?: string | null;
  description?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ShortLinkCard: React.FC<ShortLinkCardProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const shortUrl = `${window.location.origin}/s/${props.code}`;

    const handleCopyShortLink = () => {
      copy(shortUrl);
      toast.success(t('Copied to clipboard'));
    };

    const handleCopyOriginalUrl = () => {
      copy(props.originalUrl);
      toast.success(t('Copied to clipboard'));
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('Short Link Information')}</span>
            <Badge variant={props.enabled ? 'default' : 'secondary'}>
              {props.enabled ? t('Enabled') : t('Disabled')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.title && (
            <div>
              <div className="text-muted-foreground mb-1 text-sm font-medium">
                {t('Title')}
              </div>
              <div className="text-base">{props.title}</div>
            </div>
          )}

          {props.description && (
            <div>
              <div className="text-muted-foreground mb-1 text-sm font-medium">
                {t('Description')}
              </div>
              <div className="whitespace-pre-wrap text-base">
                {props.description}
              </div>
            </div>
          )}

          <div>
            <div className="text-muted-foreground mb-1 text-sm font-medium">
              {t('Short Link')}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 break-all rounded-md px-3 py-2 text-sm">
                {shortUrl}
              </code>
              <Button
                size="icon"
                variant="outline"
                Icon={LuCopy}
                onClick={handleCopyShortLink}
                title={t('Copy')}
              />
              <Button
                size="icon"
                variant="outline"
                Icon={LuExternalLink}
                onClick={() => window.open(shortUrl, '_blank')}
                title={t('Open')}
              />
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 text-sm font-medium">
              {t('Original URL')}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 break-all rounded-md px-3 py-2 text-sm">
                {props.originalUrl}
              </code>
              <Button
                size="icon"
                variant="outline"
                Icon={LuCopy}
                onClick={handleCopyOriginalUrl}
                title={t('Copy')}
              />
              <Button
                size="icon"
                variant="outline"
                Icon={LuExternalLink}
                onClick={() => window.open(props.originalUrl, '_blank')}
                title={t('Open')}
              />
            </div>
          </div>

          <div className="text-muted-foreground flex gap-4 text-sm">
            <div>
              <span className="font-medium">{t('Created')}:</span>{' '}
              {dayjs(props.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
            <div>
              <span className="font-medium">{t('Updated')}:</span>{' '}
              {dayjs(props.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ShortLinkCard.displayName = 'ShortLinkCard';
