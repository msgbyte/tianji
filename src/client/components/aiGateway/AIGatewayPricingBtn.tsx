import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { LuDollarSign } from 'react-icons/lu';
import { AIGatewayPricingModal } from './AIGatewayPricingModal';

export const AIGatewayPricingBtn: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        Icon={LuDollarSign}
        onClick={() => setIsModalOpen(true)}
        title={t('View Model Pricing')}
      />

      <AIGatewayPricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});

AIGatewayPricingBtn.displayName = 'AIGatewayPricingBtn';
