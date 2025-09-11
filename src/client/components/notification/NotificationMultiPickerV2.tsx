import React, { useMemo, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { LuPlus, LuX, LuChevronDown, LuCheck } from 'react-icons/lu';

import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/style';
import { ColorTagV2 } from '../ColorTag';

interface NotificationMultiPickerV2Props {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDisplayItems?: number;
}

export const NotificationMultiPickerV2: React.FC<NotificationMultiPickerV2Props> =
  React.memo((props) => {
    const {
      value = [],
      onValueChange,
      placeholder,
      disabled = false,
      className,
      maxDisplayItems = 3,
    } = props;
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    const { data: allNotification = [] } = trpc.notification.all.useQuery({
      workspaceId,
    });

    const selectedNotifications = useMemo(
      () =>
        allNotification.filter((notification) =>
          value.includes(notification.id)
        ),
      [allNotification, value]
    );

    const filteredNotifications = useMemo(() => {
      if (!searchText) return allNotification;
      return allNotification.filter(
        (notification) =>
          notification.name.toLowerCase().includes(searchText.toLowerCase()) ||
          notification.type.toLowerCase().includes(searchText.toLowerCase())
      );
    }, [allNotification, searchText]);

    const handleToggleNotification = (notificationId: string) => {
      const newValue = value.includes(notificationId)
        ? value.filter((id) => id !== notificationId)
        : [...value, notificationId];
      onValueChange?.(newValue);
    };

    const handleRemoveNotification = (
      notificationId: string,
      event: React.MouseEvent
    ) => {
      event.stopPropagation();
      const newValue = value.filter((id) => id !== notificationId);
      onValueChange?.(newValue);
    };

    const handleSelectAll = () => {
      const allIds = filteredNotifications.map(
        (notification) => notification.id
      );
      onValueChange?.(allIds);
    };

    const handleClearAll = () => {
      onValueChange?.([]);
    };

    const isAllSelected = useMemo(
      () =>
        filteredNotifications.length > 0 &&
        filteredNotifications.every((notification) =>
          value.includes(notification.id)
        ),
      [filteredNotifications, value]
    );

    const EmptyState = () => (
      <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
        <div className="text-muted-foreground mb-3 text-sm">
          {t('Not found any notification')}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigate({
              to: '/settings/notifications',
            });
            setIsOpen(false);
          }}
        >
          <LuPlus className="mr-2 h-4 w-4" />
          {t('Create Now')}
        </Button>
      </div>
    );

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <div
            className={cn(
              'border-input bg-background ring-offset-background focus:ring-ring flex min-h-9 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
          >
            <div className="flex flex-1 flex-wrap gap-1">
              {selectedNotifications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedNotifications
                    .slice(0, maxDisplayItems)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="bg-secondary flex items-center gap-1 rounded px-2 py-1 text-xs"
                      >
                        <ColorTagV2
                          label={notification.type}
                          className="text-xs"
                        />
                        <span className="max-w-24 truncate">
                          {notification.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleRemoveNotification(notification.id, e)
                          }
                          className="hover:text-destructive ml-1 flex-shrink-0"
                        >
                          <LuX size={12} />
                        </button>
                      </div>
                    ))}
                  {selectedNotifications.length > maxDisplayItems && (
                    <div className="bg-secondary flex items-center rounded px-2 py-1 text-xs">
                      +{selectedNotifications.length - maxDisplayItems} more
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || t('Select notifications')}
                </span>
              )}
            </div>
            <LuChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex flex-col">
            {/* Search Header */}
            <div className="border-b p-3">
              <Input
                placeholder={t('Search notifications...')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8"
              />
            </div>

            {/* Action Buttons */}
            {allNotification.length > 0 && (
              <div className="flex justify-between border-b p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isAllSelected}
                >
                  <LuCheck className="mr-2 h-4 w-4" />
                  {t('Select All')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={value.length === 0}
                >
                  <LuX className="mr-2 h-4 w-4" />
                  {t('Clear All')}
                </Button>
              </div>
            )}

            {/* Notification List */}
            <ScrollArea className="h-64">
              {allNotification.length === 0 ? (
                <EmptyState />
              ) : filteredNotifications.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  {t('No notifications found')}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredNotifications.map((notification) => {
                    const isSelected = value.includes(notification.id);
                    return (
                      <div
                        key={notification.id}
                        className="hover:bg-accent flex cursor-pointer items-center space-x-3 rounded-sm px-2 py-2"
                        onClick={() =>
                          handleToggleNotification(notification.id)
                        }
                      >
                        <Checkbox
                          checked={isSelected}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <ColorTagV2 label={notification.type} />
                          <span className="truncate text-sm">
                            {notification.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer Actions */}
            <div className="space-y-2 border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigate({
                    to: '/settings/notifications',
                  });
                  setIsOpen(false);
                }}
              >
                <LuPlus className="mr-2 h-4 w-4" />
                {t('Create new notification')}
              </Button>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                {t('Done')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  });

NotificationMultiPickerV2.displayName = 'NotificationMultiPickerV2';
