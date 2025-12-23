'use client';

import { useTheme } from '@/store/settings';
import { cn } from '@/utils/style';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const colorScheme = useTheme();

    return (
      <Streamdown
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className
        )}
        shikiTheme={
          colorScheme === 'dark'
            ? ['github-dark', 'github-light']
            : ['github-light', 'github-dark'] // as shiki can not get color schema in tianji's context
        }
        {...props}
      />
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
