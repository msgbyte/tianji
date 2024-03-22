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
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div>
        <div className="flex gap-4 px-4 pt-4">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/monitor/add')}
          >
            {t('Add new Monitor')}
          </Button>
          <Button
            type="default"
            size="large"
            onClick={() => navigate('/monitor/pages')}
          >
            {t('Pages')}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden py-5">
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
