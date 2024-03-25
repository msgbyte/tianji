import React from 'react';

export const Code: React.FC<React.PropsWithChildren> = React.memo((props) => {
  return (
    <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-1 py-0.5">
      {props.children}
    </span>
  );
});
Code.displayName = 'Code';
