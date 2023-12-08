import React from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { MonitorList } from '../../components/monitor/MonitorList';
import { MonitorAdd } from './Add';
import { MonitorDetail } from './Detail';
import { MonitorEdit } from './Edit';
import { MonitorOverview } from './Overview';

export const MonitorPage: React.FC = React.memo(() => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div>
        <div className="px-4 pt-4">
          <div
            className="px-3 py-2 rounded-full bg-green-400 hover:bg-green-500 text-white dark:text-gray-700 inline-block cursor-pointer"
            onClick={() => navigate('/monitor/add')}
          >
            Add new Montior
          </div>
        </div>
      </div>
      <div className="py-5 flex flex-1 overflow-hidden">
        <div className="w-5/12 bg-gray-50 dark:bg-gray-800">
          <MonitorList />
        </div>
        <div className="w-7/12">
          <Routes>
            <Route path="/" element={<MonitorOverview />} />
            <Route path="/:monitorId" element={<MonitorDetail />} />
            <Route path="/:monitorId/edit" element={<MonitorEdit />} />
            <Route path="/add" element={<MonitorAdd />} />
          </Routes>
        </div>
      </div>
    </div>
  );
});
MonitorPage.displayName = 'MonitorPage';
