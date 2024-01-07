import React from 'react';
import { Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import clsx from 'clsx';
import { DashboardGridItem } from './items';
import { DashboardItem } from '../../store/dashboard';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  isEditMode: boolean;
  items: DashboardItem[];
  layouts: Layouts;
  onChangeLayouts: (layouts: Layouts) => void;
}
export const DashboardGrid: React.FC<DashboardGridProps> = React.memo(
  (props) => {
    const { layouts, onChangeLayouts, items, isEditMode } = props;

    return (
      <ResponsiveGridLayout
        className={clsx('layout', isEditMode && 'select-none')}
        layouts={layouts}
        rowHeight={50}
        draggableCancel=".non-draggable"
        isDraggable={isEditMode}
        isResizable={isEditMode}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 4, md: 3, sm: 2 }}
        onLayoutChange={(currentLayout, allLayouts) => {
          onChangeLayouts(allLayouts);
        }}
      >
        {items.map((item) => (
          <div key={item.key}>
            <DashboardGridItem item={item} />
          </div>
        ))}
      </ResponsiveGridLayout>
    );
  }
);
DashboardGrid.displayName = 'DashboardGrid';
