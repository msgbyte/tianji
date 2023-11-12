import { useMemo } from 'react';
import { DashboardItem, useDashboardStore } from '../../../store/dashboard';
import { WebsiteOverviewItem } from './WebsiteOverviewItem';
import { NotFoundTip } from '../../NotFoundTip';
import { Button, Card } from 'antd';
import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { useEvent } from '../../../hooks/useEvent';

interface DashboardGridItemProps {
  item: DashboardItem;
}
export const DashboardGridItem: React.FC<DashboardGridItemProps> = React.memo(
  (props) => {
    const { isEditMode, removeItem } = useDashboardStore();
    const { key, id, title, type } = props.item;

    const inner = useMemo(() => {
      if (type === 'websiteOverview') {
        return <WebsiteOverviewItem websiteId={id} />;
      } else {
        return <NotFoundTip />;
      }
    }, [id, type]);

    const handleDelete = useEvent(
      (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        console.log('e', e, key);
        e.stopPropagation();
        removeItem(key);
      }
    );

    return (
      <Card
        className="h-full w-full overflow-auto"
        title={title}
        extra={
          isEditMode && (
            <Button
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            />
          )
        }
      >
        {inner}
      </Card>
    );
  }
);
DashboardGridItem.displayName = 'DashboardGridItem';
