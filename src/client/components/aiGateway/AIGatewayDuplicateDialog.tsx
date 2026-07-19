import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AIGatewayDuplicateDialogProps {
  gatewayId: string;
  gatewayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_GATEWAY_NAME_LENGTH = 100;
const COPY_NAME_SUFFIX = ' - Copy';

function buildDuplicateName(gatewayName: string) {
  return `${gatewayName.slice(
    0,
    MAX_GATEWAY_NAME_LENGTH - COPY_NAME_SUFFIX.length
  )}${COPY_NAME_SUFFIX}`;
}

export function AIGatewayDuplicateDialog({
  gatewayId,
  gatewayName,
  open,
  onOpenChange,
}: AIGatewayDuplicateDialogProps) {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();
  const [name, setName] = useState('');

  const duplicateMutation = trpc.aiGateway.duplicate.useMutation({
    onError: defaultErrorHandler,
  });

  useEffect(() => {
    setName(open ? buildDuplicateName(gatewayName) : '');
  }, [gatewayName, open]);

  const handleOpenChange = useEvent((nextOpen: boolean) => {
    if (duplicateMutation.isPending) {
      return;
    }

    onOpenChange(nextOpen);
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
      onOpenChange(false);
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
              maxLength={MAX_GATEWAY_NAME_LENGTH}
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
