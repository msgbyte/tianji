import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { LuCircleHelp } from 'react-icons/lu';

interface TipIconProps {
  className?: string;
  content: React.ReactNode;
}
export const TipIcon: React.FC<TipIconProps> = React.memo((props) => {
  const { className, content } = props;

  return (
    <Tooltip>
      <TooltipTrigger type="button">
        <LuCircleHelp className={className} />
      </TooltipTrigger>

      <TooltipContent className="max-w-xl">{content}</TooltipContent>
    </Tooltip>
  );
});
TipIcon.displayName = 'TipIcon';
