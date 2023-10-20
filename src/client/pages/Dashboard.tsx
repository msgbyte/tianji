import React, { Fragment, useMemo, useState } from 'react';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Divider, Empty } from 'antd';
import { WebsiteOverview } from '../components/website/WebsiteOverview';
import { useCurrentWorkspace } from '../store/user';
import { Loading } from '../components/Loading';
import { useWorspaceWebsites } from '../api/model/website';
import { NoWorkspaceTip } from '../components/NoWorkspaceTip';
import { useNavigate } from 'react-router';
import { useEvent } from '../hooks/useEvent';
import arrayMove from 'array-move';
import SortableList, { SortableItem } from 'react-easy-sort';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '../api/trpc';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = React.memo(() => {
  const workspace = useCurrentWorkspace();
  const navigate = useNavigate();
  const [isEditLayout, setIsEditLayout] = useState(false);
  const { isLoading, websiteList, handleSortEnd } = useDashboardWebsiteList();

  if (!workspace) {
    return <NoWorkspaceTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="py-4">
      <div className="h-20 flex items-center">
        <div className="text-2xl flex-1">Dashboard</div>
        <div>
          {websiteList.length !== 0 && (
            <Button
              icon={<EditOutlined />}
              size="large"
              onClick={() => setIsEditLayout((state) => !state)}
            >
              {isEditLayout ? 'Done' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {isEditLayout ? (
        <SortableList
          className="space-y-2"
          lockAxis="y"
          onSortEnd={handleSortEnd}
        >
          {websiteList.map((website) => (
            <SortableItem key={website.id}>
              <div className="overflow-hidden h-14 w-full border border-black border-opacity-20 flex justify-center items-center rounded-lg bg-white cursor-move">
                {website.name}
              </div>
            </SortableItem>
          ))}
        </SortableList>
      ) : (
        <div>
          {websiteList.length === 0 && (
            <Empty
              description={
                <div>
                  <div>There is no website has been created</div>
                  <Link to="/settings/websites">
                    <Button>Add webiste</Button>
                  </Link>
                </div>
              }
            />
          )}

          {websiteList.map((website, i) => (
            <Fragment key={website.id}>
              {i !== 0 && <Divider />}

              <WebsiteOverview
                website={website}
                actions={
                  <>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        navigate(`/website/${website.id}`);
                      }}
                    >
                      View Details <ArrowRightOutlined />
                    </Button>
                  </>
                }
              />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
});
Dashboard.displayName = 'Dashboard';

function useDashboardWebsiteList() {
  const workspace = useCurrentWorkspace();
  const workspaceId = workspace.id;
  const { isLoading, websites } = useWorspaceWebsites(workspaceId);
  const [dashboardOrder, setDashboardOrder] = useState(
    workspace.dashboardOrder
  );
  const updateDashboardOrderMutation =
    trpc.workspace.updateDashboardOrder.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });

  const websiteList = useMemo(
    () =>
      websites.sort((a, b) => {
        const aIndex = dashboardOrder.findIndex((item) => item === a.id);
        const bIndex = dashboardOrder.findIndex((item) => item === b.id);

        // In both cases, if in the sorted list, they are sorted according to the sorted list.
        // If not in the sorted list, put it first
        return aIndex - bIndex;
      }),
    [websites, dashboardOrder]
  );

  const handleSortEnd = useEvent((oldIndex: number, newIndex: number) => {
    const newOrder = arrayMove(
      websiteList.map((w) => w.id),
      oldIndex,
      newIndex
    );
    setDashboardOrder(newOrder);

    updateDashboardOrderMutation.mutate({
      workspaceId,
      dashboardOrder: newOrder,
    });
  });

  return {
    isLoading,
    websiteList,
    handleSortEnd,
  };
}
