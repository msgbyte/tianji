import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCopy } from 'react-icons/lu';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AIGatewayDuplicateDialogProps {
  gatewayId: string;
  gatewayName: string;
}

export function AIGatewayDuplicateDialog({
  gatewayId,
  gatewayName,
}: AIGatewayDuplicateDialogProps) {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const duplicateMutation = trpc.aiGateway.duplicate.useMutation({
    onError: defaultErrorHandler,
  });

  const handleOpenChange = useEvent((nextOpen: boolean) => {
    if (duplicateMutation.isPending) {
      return;
    }

    setOpen(nextOpen);
    setName(nextOpen ? `${gatewayName} - Copy` : '');
  });

  const handleDuplicate = useEvent(async () => {
    const duplicateName = name.trim();
    if (!duplicateName || duplicateMutation.isPending) {
      return;
    }

    try {
      const duplicate = await duplicateMutation.mutateAsync({
        workspaceId,
        gatewayId,
        name: duplicateName,
      });

      await trpcUtils.aiGateway.all.refetch({ workspaceId });
      setOpen(false);
      setName('');
      navigate({
        to: '/aiGateway/$gatewayId',
        params: { gatewayId: duplicate.id },
      });
    } catch {
      // Mutation errors are displayed by defaultErrorHandler.
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild={true}>
        <Button
          size="icon"
          variant="outline"
          Icon={LuCopy}
          aria-label={t('Duplicate')}
          title={t('Duplicate')}
        />
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (duplicateMutation.isPending) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (duplicateMutation.isPending) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('Duplicate AI Gateway')}</DialogTitle>
          <DialogDescription>
            {t(
              'Create a copy of this AI Gateway with the same configuration.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-gateway-duplicate-name" className="text-right">
              {t('AI Gateway Name')}
            </Label>
            <Input
              id="ai-gateway-duplicate-name"
              className="col-span-3"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={duplicateMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            aria-label={t('Duplicate gateway')}
            disabled={!name.trim() || duplicateMutation.isPending}
            loading={duplicateMutation.isPending}
            onClick={handleDuplicate}
          >
            {t('Duplicate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
