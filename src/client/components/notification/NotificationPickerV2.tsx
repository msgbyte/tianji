import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { LuPlus, LuX } from 'react-icons/lu';

import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/style';
import { ColorTagV2 } from '../ColorTag';

interface NotificationPickerV2Props {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const NotificationPickerV2: React.FC<NotificationPickerV2Props> =
  React.memo((props) => {
    const {
      value,
      onValueChange,
      placeholder,
      disabled = false,
      className,
    } = props;
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();

    const { data: allNotification = [] } = trpc.notification.all.useQuery({
      workspaceId,
    });

    const selectedNotification = useMemo(
      () => allNotification.find((notification) => notification.id === value),
      [allNotification, value]
    );

    const handleValueChange = (selectedValue: string) => {
      if (selectedValue === 'create-new') {
        navigate({
          to: '/settings/notifications',
        });
        return;
      }

      if (selectedValue === 'clear-selection') {
        onValueChange?.(undefined);
        return;
      }

      onValueChange?.(selectedValue);
    };

    const EmptyState = () => (
      <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
        <div className="text-muted-foreground mb-3 text-sm">
          {t('Not found any notification')}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate({
              to: '/settings/notifications',
            })
          }
        >
          <LuPlus className="mr-2 h-4 w-4" />
          {t('Create Now')}
        </Button>
      </div>
    );

    return (
      <Select
        value={value || ''}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn('w-full', className)}>
          <SelectValue placeholder={placeholder || t('Select notification')}>
            {selectedNotification && (
              <div className="flex items-center gap-2">
                <ColorTagV2 label={selectedNotification.type} />
                <span className="truncate">{selectedNotification.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allNotification.length === 0 ? (
            <div className="p-2">
              <EmptyState />
            </div>
          ) : (
            <>
              {allNotification.map((notification) => (
                <SelectItem key={notification.id} value={notification.id}>
                  <div className="flex items-center gap-2">
                    <ColorTagV2 label={notification.type} />
                    <span className="truncate">{notification.name}</span>
                  </div>
                </SelectItem>
              ))}
              <div className="my-1 border-t" />
              {selectedNotification && (
                <SelectItem value="clear-selection">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <LuX className="h-4 w-4" />
                    <span>{t('Clear selection')}</span>
                  </div>
                </SelectItem>
              )}
              <SelectItem value="create-new">
                <div className="text-primary flex items-center gap-2">
                  <LuPlus className="h-4 w-4" />
                  <span>{t('Create new notification')}</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    );
  });

NotificationPickerV2.displayName = 'NotificationPickerV2';
