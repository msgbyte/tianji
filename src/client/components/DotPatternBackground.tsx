import React, { useEffect, useRef } from 'react';

export const DotPatternBackground: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mouseMoveEvent = (e: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      const scale = window.visualViewport?.scale;
      // disable mouse movement on viewport zoom - causes page to slow down
      if (scale === 1) {
        const targetX = e.clientX;
        const targetY = e.clientY;

        containerRef.current.style.setProperty('--mouseX', `${targetX}px`);
        containerRef.current.style.setProperty('--mouseY', `${targetY}px`);
      }
    };

    document.addEventListener('mousemove', mouseMoveEvent);

    return () => {
      document.removeEventListener('mousemove', mouseMoveEvent);
    };
  });

  return (
    <div ref={containerRef} className="fixed left-0 top-0 -z-50">
      <div className="sticky left-0 top-0 h-screen w-screen overflow-hidden">
        <div className="bg-muted-foreground/15 absolute inset-0 -z-10" />
        <div className="bg-gradient-radial from-muted-foreground/40 absolute left-[--mouseX] top-[--mouseY] -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full from-0% to-transparent to-90% blur-md" />
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern
              id="dotted-pattern"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="black" />
            </pattern>
            <mask id="dots-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect width="100%" height="100%" fill="url(#dotted-pattern)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="hsl(var(--background))"
            mask="url(#dots-mask)"
          />
        </svg>
      </div>
    </div>
  );
});
DotPatternBackground.displayName = 'DotPatternBackground';
