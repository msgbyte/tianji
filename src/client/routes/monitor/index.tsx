import { CommonPageEmpty } from '@/components/CommonPageEmpty';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/monitor/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();

  return (
    <CommonPageEmpty
      text={t('Not any monitor has been exist')}
      buttonText={t('Add Monitor Now')}
      buttonUrl="/monitor/add"
    />
  );
}
