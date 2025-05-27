import { CommonPageEmpty } from '@/components/CommonPageEmpty';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/page/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();

  return (
    <CommonPageEmpty
      text={t('Not any page has been exist')}
      buttonText={t('Add Page Now')}
      buttonUrl="/page/add"
    />
  );
}
