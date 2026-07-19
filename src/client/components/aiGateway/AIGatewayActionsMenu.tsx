import { useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCopy, LuEllipsisVertical, LuPencil, LuTrash } from 'react-icons/lu';
import { AIGatewayDuplicateDialog } from '@/components/aiGateway/AIGatewayDuplicateDialog';
import { AlertConfirm } from '@/components/AlertConfirm';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AIGatewayActionsMenuProps {
  gatewayId: string;
  gatewayName: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function AIGatewayActionsMenu(props: AIGatewayActionsMenuProps) {
  const { t } = useTranslation();
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button
            variant="outline"
            size="icon"
            Icon={LuEllipsisVertical}
            aria-label={t('More')}
            title={t('More')}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={props.onEdit}>
            <LuPencil className="mr-2" />
            {t('Edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDuplicateOpen(true)}>
            <LuCopy className="mr-2" />
            {t('Duplicate')}
          </DropdownMenuItem>
          <AlertConfirm
            title={`${t('Delete AI Gateway')} ${props.gatewayName}`}
            description={t(
              'Are you sure you want to delete this AI Gateway? This action cannot be undone.'
            )}
            onConfirm={props.onDelete}
          >
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="text-red-600 data-[highlighted]:!bg-red-50 data-[highlighted]:!text-red-700"
            >
              <LuTrash className="mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </AlertConfirm>
        </DropdownMenuContent>
      </DropdownMenu>
      <AIGatewayDuplicateDialog
        gatewayId={props.gatewayId}
        gatewayName={props.gatewayName}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
    </>
  );
}
