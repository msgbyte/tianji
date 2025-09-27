import { useEffect, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCoins, LuExternalLink, LuLoader } from 'react-icons/lu';

import { defaultErrorHandler, trpc } from '@/api/trpc';
import { useEventWithLoading } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { appendUrlQueryParams } from '@/utils/url';
import { cn } from '@/utils/style';
import { toast } from 'sonner';
import React from 'react';

interface CreditRechargeProps {
  onSuccess?: () => void;
}

export const CreditRecharge: React.FC<CreditRechargeProps> = React.memo(
  ({ onSuccess }: CreditRechargeProps) => {
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const { data: packs, isLoading } = trpc.billing.creditPacks.useQuery({
      workspaceId,
    });

    const [selectedPack, setSelectedPack] = useState<string | undefined>();

    useEffect(() => {
      if (packs && packs.length > 0 && !selectedPack) {
        setSelectedPack(packs[0].id);
      }
    }, [packs, selectedPack]);

    const checkoutMutation = trpc.billing.creditCheckout.useMutation({
      onError: defaultErrorHandler,
    });

    const [handleRecharge, isSubmitting] = useEventWithLoading(async () => {
      if (!selectedPack) {
        toast.warning(t('Please select a credit pack'));
        return;
      }

      const { url } = await checkoutMutation.mutateAsync({
        workspaceId,
        packId: selectedPack,
        redirectUrl: appendUrlQueryParams(location.href, {
          status: 'success',
        }),
      });

      onSuccess?.();
      location.href = url;
    });

    if (isLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <LuCoins className="h-4 w-4" />
            <CardTitle>{t('Purchase Credits')}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2">
            <LuLoader className="h-4 w-4 animate-spin" />
            {t('Loading credit packs...')}
          </CardContent>
        </Card>
      );
    }

    if (!packs || packs.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <LuCoins className="h-4 w-4" />
          <CardTitle>{t('Purchase Credits')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedPack}
            onValueChange={(value) => setSelectedPack(value)}
            className="flex flex-col gap-3"
          >
            {packs.map((pack) => (
              <Label
                key={pack.id}
                htmlFor={`credit-pack-${pack.id}`}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors',
                  selectedPack === pack.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={pack.id}
                    id={`credit-pack-${pack.id}`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium">{pack.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {pack.credit} {t('Credits')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {pack.currency} {pack.price.toFixed(2)}
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>

          <Button
            className="w-full"
            disabled={isSubmitting || checkoutMutation.isPending}
            loading={isSubmitting || checkoutMutation.isPending}
            onClick={handleRecharge}
          >
            {t('Proceed to Payment')}
            <LuExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
);
CreditRecharge.displayName = 'CreditRecharge';
