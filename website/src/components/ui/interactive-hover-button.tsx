import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowRightIcon } from '@radix-ui/react-icons';

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = 'Button', className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'bg-background group relative w-32 cursor-pointer overflow-hidden rounded-full border p-2 text-center font-semibold',
        className
      )}
      {...props}
    >
      <span className="text-primary inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRightIcon />
      </div>
      <div className="bg-primary group-hover:bg-primary absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-full transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8]"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = 'InteractiveHoverButton';
