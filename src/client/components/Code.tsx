import React from 'react';

export const Code: React.FC<React.PropsWithChildren> = React.memo((props) => {
  return (
    <span className="rounded-sm border border-zinc-200 bg-zinc-100 px-1 py-0.5 dark:border-zinc-800 dark:bg-zinc-900">
      {props.children}
    </span>
  );
});
Code.displayName = 'Code';
