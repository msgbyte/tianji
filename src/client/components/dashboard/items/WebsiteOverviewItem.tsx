import React from 'react';
import { trpc } from '../../../api/trpc';
import { useCurrentWorkspaceId } from '../../../store/user';
import { Loading } from '../../Loading';
import { NotFoundTip } from '../../NotFoundTip';
import { WebsiteOverview } from '../../website/WebsiteOverview';
import { Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from '@i18next-toolkit/react';
import { Link } from '@tanstack/react-router';

export const WebsiteOverviewItem: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: websiteInfo, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: props.websiteId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!websiteInfo) {
    return <NotFoundTip />;
  }

  return (
    <WebsiteOverview
      website={websiteInfo}
      actions={
        <>
          <Link to="/website/$websiteId" params={{ websiteId: websiteInfo.id }}>
            <Button type="primary" size="large">
              {t('View Details')} <ArrowRightOutlined />
            </Button>
          </Link>
        </>
      }
    />
  );
});
WebsiteOverviewItem.displayName = 'WebsiteOverviewItem';
