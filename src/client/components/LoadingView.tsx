import React from 'react';
import { cn } from '@/utils/style';
import { Spinner } from './ui/spinner';
import { DelayRender } from './DelayRender';

interface LoadingViewProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerClassName?: string;
  maskClassName?: string;
  text?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = React.memo(
  ({
    isLoading,
    children,
    className,
    spinnerClassName,
    maskClassName,
    text = 'Loading...',
  }) => {
    return (
      <div className={cn('relative', className)}>
        {children}
        {isLoading && (
          <DelayRender>
            <div
              className={cn(
                'bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
                maskClassName
              )}
              style={{ pointerEvents: 'auto' }}
            >
              <div className="flex flex-col items-center gap-2">
                <Spinner
                  className={cn('text-primary h-6 w-6', spinnerClassName)}
                />

                {text && (
                  <p className="text-muted-foreground text-sm">{text}</p>
                )}
              </div>
            </div>
          </DelayRender>
        )}
      </div>
    );
  }
);

LoadingView.displayName = 'LoadingView';
