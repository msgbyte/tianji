import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface DialogProps extends React.PropsWithChildren {
  title?: string;
  description?: string;
  content?: React.ReactNode;
}
export const DialogWrapper: React.FC<DialogProps> = React.memo((props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        {props.content}
      </DialogContent>
    </Dialog>
  );
});
DialogWrapper.displayName = 'DialogWrapper';
