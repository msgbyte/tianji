import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { useCurrentWorkspaceId } from '../../store/user';
import { WebsiteVisitorMap } from '../../components/website/WebsiteVisitorMap';
import { DateFilter } from '../../components/DateFilter';
import { LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';

export const WebsiteVisitorMapPage: React.FC = React.memo(() => {
  const { websiteId } = useParams();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: websiteId!,
  });
  const navigate = useNavigate();

  if (!websiteId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!website) {
    return <NotFoundTip />;
  }

  return (
    <div className="py-6">
      <div className="pb-2 flex items-center justify-between">
        <Button
          size="large"
          icon={<LeftOutlined />}
          onClick={() => navigate(`/website/${websiteId}`)}
        />
        <div>
          <span className="font-bold">{website.name}</span>
          {t("'s visitor map")}
        </div>
        <DateFilter />
      </div>
      <WebsiteVisitorMap websiteId={websiteId} />
    </div>
  );
});
WebsiteVisitorMapPage.displayName = 'WebsiteVisitorMapPage';
