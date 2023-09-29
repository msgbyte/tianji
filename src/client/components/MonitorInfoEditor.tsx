import React from 'react';
import type { Monitor } from '@prisma/client';

type MonitorInfoEditorValues = Omit<Monitor, 'id'> & {
  id?: string;
};

interface MonitorInfoEditorProps {
  initValue?: MonitorInfoEditorValues;
  onSave: (value: MonitorInfoEditorValues) => void;
}
export const MonitorInfoEditor: React.FC<MonitorInfoEditorProps> = React.memo(
  (props) => {
    return <div>MonitorInfoEditor</div>;
  }
);
MonitorInfoEditor.displayName = 'MonitorInfoEditor';
