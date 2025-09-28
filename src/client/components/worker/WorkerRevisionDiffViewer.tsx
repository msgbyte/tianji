import React, { useMemo } from 'react';
import { CodeDiffEditor } from '@/components/CodeEditor';
import { cn } from '@/utils/style';

interface WorkerRevisionDiffViewerProps {
  className?: string;
  leftTitle: string;
  rightTitle: string;
  leftCode: string;
  rightCode: string;
  height?: number | string;
}

export const WorkerRevisionDiffViewer: React.FC<
  WorkerRevisionDiffViewerProps
> = ({
  className,
  leftTitle,
  rightTitle,
  leftCode,
  rightCode,
  height = 420,
}) => {
  const options = useMemo(
    () => ({
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderSideBySide: true,
    }),
    []
  );

  return (
    <div
      className={cn('w-full overflow-hidden rounded-md border', className)}
      style={{ height }}
    >
      <CodeDiffEditor
        original={leftCode}
        modified={rightCode}
        height="100%"
        options={options}
        aria-label={`${leftTitle} vs ${rightTitle}`}
      />
    </div>
  );
};
WorkerRevisionDiffViewer.displayName = 'WorkerRevisionDiffViewer';
