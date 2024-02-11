import { Button, Card } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { MetricsTable } from '../../components/website/MetricsTable';
import { WebsiteOverview } from '../../components/website/WebsiteOverview';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { useCurrentWorkspaceId } from '../../store/user';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from '@i18next-toolkit/react';

export const WebsiteDetail: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { websiteId } = useParams();
  const workspaceId = useCurrentWorkspaceId();
  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: websiteId!,
  });
  const { startDate, endDate } = useGlobalRangeDate();
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

  const startAt = startDate.unix() * 1000;
  const endAt = endDate.unix() * 1000;

  return (
    <div className="py-6">
      <Card>
        <Card.Grid hoverable={false} className="!w-full">
          <WebsiteOverview website={website} showDateFilter={true} />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="url"
            title={[t('Pages'), t('Views')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="referrer"
            title={[t('Referrers'), t('Views')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="browser"
            title={[t('Browser'), t('Visitors')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="os"
            title={[t('OS'), t('Visitors')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="device"
            title={[t('Devices'), t('Visitors')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="country"
            title={[t('Countries'), t('Visitors')]}
            startAt={startAt}
            endAt={endAt}
          />
          <Button
            size="small"
            className="m-auto flex flex-row-reverse items-center mt-1"
            styles={{ icon: { marginRight: 0, marginLeft: 8 } }}
            icon={<RightOutlined className="m-0" />}
            onClick={() => navigate(`/website/${websiteId}/map`)}
          >
            {t('Visitor Map')}
          </Button>
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="event"
            title={[t('Events'), t('Actions')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
      </Card>
    </div>
  );
});
WebsiteDetail.displayName = 'WebsiteDetail';
