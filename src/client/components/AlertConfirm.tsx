import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from './ui/alert-dialog';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from './ui/button';

interface AlertConfirmProps extends React.PropsWithChildren {
  title?: string;
  description?: string;
  content?: React.ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void | Promise<void>;
}
export const AlertConfirm: React.FC<AlertConfirmProps> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {props.title ?? t('Confirm action')}
          </AlertDialogTitle>
          {props.description && (
            <AlertDialogDescription>{props.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <div>{props.content ?? t('Are you sure you want to do this?')}</div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.onCancel}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={props.onConfirm}>
            {t('Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
AlertConfirm.displayName = 'AlertConfirm';
