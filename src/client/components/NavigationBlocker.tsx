import React, { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NavigationBlockerProps {
  /**
   * Whether to block navigation
   */
  when: boolean;
  /**
   * Custom title for the confirmation dialog
   */
  title?: string;
  /**
   * Custom description for the confirmation dialog
   */
  description?: string;
  /**
   * Custom text for the cancel button
   */
  cancelText?: string;
  /**
   * Custom text for the confirm button
   */
  confirmText?: string;
}

/**
 * Component to block navigation when there are unsaved changes
 * Shows a confirmation dialog to the user before allowing navigation
 */
export function NavigationBlocker({
  when,
  title,
  description,
  cancelText,
  confirmText,
}: NavigationBlockerProps) {
  const { t } = useTranslation();

  // State for navigation blocker dialog
  const [showBlockerDialog, setShowBlockerDialog] = useState(false);
  const [blockerResolver, setBlockerResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  // Use blocker to prevent navigation when condition is met
  useBlocker(() => {
    return new Promise<boolean>((resolve) => {
      setShowBlockerDialog(true);
      setBlockerResolver({ resolve });
    });
  }, when);

  const handleBlockerCancel = useEvent(() => {
    setShowBlockerDialog(false);
    if (blockerResolver) {
      blockerResolver.resolve(false); // Block the navigation
      setBlockerResolver(null);
    }
  });

  const handleBlockerConfirm = useEvent(() => {
    setShowBlockerDialog(false);
    if (blockerResolver) {
      blockerResolver.resolve(true); // Allow the navigation
      setBlockerResolver(null);
    }
  });

  return (
    <AlertDialog
      open={showBlockerDialog}
      onOpenChange={(open) => {
        if (!open) {
          handleBlockerCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t('Unsaved Changes')}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              t(
                'You have unsaved changes that will be lost if you leave. Are you sure you want to discard them?'
              )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleBlockerCancel}>
            {cancelText ?? t('Stay on Page')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleBlockerConfirm}>
            {confirmText ?? t('Discard Changes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
