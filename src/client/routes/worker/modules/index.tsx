import { Empty } from 'antd';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { LuPlus } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';

export const Route = createFileRoute('/worker/modules/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();

  return (
    <CommonWrapper
      header={<CommonHeader title={t('Shared Modules')} />}
    >
      <Empty
        className="pt-8"
        description={
          <div className="space-y-3">
            <p>{t('No shared modules yet.')}</p>
            {hasAdminPermission && (
              <Button
                Icon={LuPlus}
                onClick={() => navigate({ to: '/worker/modules/add' })}
              >
                {t('Create Shared Module')}
              </Button>
            )}
          </div>
        }
      />
    </CommonWrapper>
  );
}
