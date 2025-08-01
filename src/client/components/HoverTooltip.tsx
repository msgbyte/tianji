import React, { ReactNode, useEffect, useState } from 'react';

interface HoverTooltipProps {
  children: ReactNode;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = React.memo(
  ({ children }) => {
    const [position, setPosition] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
      // Listen to mousemove event and update tooltip position
      const handler = (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('mousemove', handler);

      return () => {
        document.removeEventListener('mousemove', handler);
      };
    }, []);

    return (
      <div
        className="after:border-t-opacity-80 pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+10px)] transform rounded-md bg-black bg-opacity-80 px-2 py-1 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black"
        style={{ left: position.x, top: position.y }}
      >
        {children}
      </div>
    );
  }
);
HoverTooltip.displayName = 'HoverTooltip';
