import { CommonPageEmpty } from '@/components/CommonPageEmpty';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/application/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();

  return (
    <CommonPageEmpty
      text={t('Not any application has been exist')}
      buttonText={t('Add Application Now')}
      buttonUrl="/application/add"
    />
  );
}
