import { CommonPageEmpty } from '@/components/CommonPageEmpty';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/aiGateway/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();

  return (
    <CommonPageEmpty
      text={t('Not any ai gateway has been exist')}
      buttonText={t('Add Ai Gateway Now')}
      buttonUrl="/aiGateway/add"
    />
  );
}
