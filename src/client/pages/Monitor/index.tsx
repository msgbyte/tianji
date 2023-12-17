import React from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { MonitorList } from '../../components/monitor/MonitorList';
import { MonitorAdd } from './Add';
import { MonitorDetail } from './Detail';
import { MonitorEdit } from './Edit';
import { MonitorOverview } from './Overview';
import { Button } from 'antd';
import { MonitorPageList } from './PageList';
import { MonitorPageAdd } from './PageAdd';

export const MonitorPage: React.FC = React.memo(() => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div>
        <div className="px-4 pt-4 flex gap-4">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/monitor/add')}
          >
            Add new Montior
          </Button>
          <Button
            type="default"
            size="large"
            onClick={() => navigate('/monitor/pages')}
          >
            Pages
          </Button>
        </div>
      </div>
      <div className="py-5 flex flex-1 overflow-hidden">
        <div className="w-5/12 rounded bg-gray-50 dark:bg-gray-800">
          <MonitorList />
        </div>
        <div className="w-7/12">
          <Routes>
            <Route path="/" element={<MonitorOverview />} />
            <Route path="/:monitorId" element={<MonitorDetail />} />
            <Route path="/:monitorId/edit" element={<MonitorEdit />} />
            <Route path="/add" element={<MonitorAdd />} />
            <Route path="/pages" element={<MonitorPageList />} />
            <Route path="/pages/add" element={<MonitorPageAdd />} />
          </Routes>
        </div>
      </div>
    </div>
  );
});
MonitorPage.displayName = 'MonitorPage';
