import { cn } from '@/utils/style';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import React from 'react';
import { LuChevronRight } from 'react-icons/lu';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ asChild, className, ...props }, ref) => {
  let children = props.children;
  if (typeof props.children === 'string') {
    children = (
      <div className="flex items-center">
        <LuChevronRight
          className={cn(
            'mr-1 transition-transform group-data-[state=open]/collapsible:rotate-90'
          )}
        />

        <span className="font-semibold">{props.children}</span>
      </div>
    );
  }

  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      {...props}
      className={cn('group/collapsible', className)}
    >
      {children}
    </CollapsiblePrimitive.CollapsibleTrigger>
  );
});
CollapsibleTrigger.displayName =
  CollapsiblePrimitive.CollapsibleTrigger.displayName;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
