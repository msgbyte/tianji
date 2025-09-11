import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationPicker } from '../notification/NotificationPicker';
import { AlertConfirm } from '@/components/AlertConfirm';

interface AIGatewayQuotaAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatewayId: string;
}

export const AIGatewayQuotaAlertModal: React.FC<
  AIGatewayQuotaAlertModalProps
> = ({ isOpen, onClose, gatewayId }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [dailyQuota, setDailyQuota] = useState<string>('0');
  const [enabled, setEnabled] = useState(false);
  const [notificationId, setNotificationId] = useState<string | undefined>();
  const trpcUtils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch current quota alert settings
  const { data: quotaAlert, isLoading: isLoadingQuota } =
    trpc.aiGateway.quotaAlert.get.useQuery(
      {
        workspaceId,
        gatewayId,
      },
      {
        enabled: isOpen,
      }
    );

  // Update form when quota alert data changes
  useEffect(() => {
    if (quotaAlert) {
      setDailyQuota(quotaAlert.dailyQuota.toString());
      setEnabled(quotaAlert.enabled);
      setNotificationId(
        quotaAlert.notificationId ? quotaAlert.notificationId : undefined
      );
    } else {
      setDailyQuota('0');
      setEnabled(false);
      setNotificationId(undefined);
    }
  }, [quotaAlert]);

  const upsertMutation = trpc.aiGateway.quotaAlert.upsert.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const deleteMutation = trpc.aiGateway.quotaAlert.delete.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quota = parseFloat(dailyQuota);
    if (isNaN(quota) || quota < 0) {
      return;
    }

    await upsertMutation.mutateAsync({
      workspaceId,
      gatewayId,
      dailyQuota: quota,
      enabled,
      notificationId: notificationId,
    });
    trpcUtils.aiGateway.quotaAlert.get.invalidate({
      workspaceId,
      gatewayId,
    });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      workspaceId,
      gatewayId,
    });
    trpcUtils.aiGateway.quotaAlert.get.invalidate({
      workspaceId,
      gatewayId,
    });
  };

  const isLoading = upsertMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden" ref={containerRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('Quota Alert')}
          </DialogTitle>
          <DialogDescription>
            {t('Set up daily cost quota alerts')}
          </DialogDescription>
        </DialogHeader>

        {isLoadingQuota ? (
          <div className="flex h-32 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t(
                  'When daily cost exceeds the quota, a notification will be sent to the selected channel.'
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-sm font-medium">
                  {t('Enable Quota Alert')}
                </Label>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyQuota" className="text-sm font-medium">
                  {t('Daily Quota (USD)')}
                </Label>
                <Input
                  id="dailyQuota"
                  type="number"
                  step="0.01"
                  min="0"
                  value={dailyQuota}
                  onChange={(e) => setDailyQuota(e.target.value)}
                  placeholder="0.00"
                  disabled={!enabled}
                />
                <p className="text-muted-foreground text-xs">
                  {t('Set to 0 to disable quota checking')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification" className="text-sm font-medium">
                  {t('Notification Channel')}
                </Label>
                <NotificationPicker
                  value={notificationId as any}
                  onChange={setNotificationId as any}
                  disabled={!enabled}
                  placeholder={t('Select notification channel')}
                  allowClear={true}
                  className="w-full"
                  getPopupContainer={() => containerRef.current!}
                />
                <p className="text-muted-foreground text-xs">
                  {t('Choose a notification channel to receive quota alerts')}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                {quotaAlert && (
                  <AlertConfirm
                    title={t('Delete Quota Alert')}
                    description={t(
                      'Are you sure you want to delete this quota alert?'
                    )}
                    content={t(
                      'This action cannot be undone. The quota alert will be permanently removed.'
                    )}
                    onConfirm={handleDelete}
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isLoading}
                    >
                      {t('Delete')}
                    </Button>
                  </AlertConfirm>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {quotaAlert ? t('Update') : t('Create')}
                </Button>
              </div>
            </div>
          </form>
        )}

        {(upsertMutation.error || deleteMutation.error) && (
          <div className="mt-4">
            <ErrorTip />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
