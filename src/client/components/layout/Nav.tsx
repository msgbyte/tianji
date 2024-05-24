import { buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/style';
import { Link, useRouterState } from '@tanstack/react-router';
import React from 'react';
import { IconType } from 'react-icons';

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: IconType;
    to: string;
  }[];
}

export const Nav: React.FC<NavProps> = React.memo(({ links, isCollapsed }) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const isSelect = pathname.startsWith(link.to);
          const variant = isSelect ? 'default' : 'ghost';

          return isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  className={cn(
                    buttonVariants({ variant: variant, size: 'icon' }),
                    'h-9 w-9 cursor-pointer',
                    variant === 'default' &&
                      'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white'
                  )}
                  to={link.to}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="text-muted-foreground ml-auto">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={index}
              to={link.to}
              className={cn(
                buttonVariants({ variant: variant, size: 'sm' }),
                variant === 'default' &&
                  'dark:bg-muted dark:hover:bg-muted dark:text-white dark:hover:text-white',
                'cursor-pointer justify-start'
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    'ml-auto',
                    variant === 'default' && 'text-background dark:text-white'
                  )}
                >
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
});
Nav.displayName = 'Nav';
