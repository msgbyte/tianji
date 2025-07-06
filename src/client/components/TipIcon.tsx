import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { LuCircleHelp } from 'react-icons/lu';

interface TipIconProps {
  className?: string;
  content: React.ReactNode;
  onClick?: () => void;
}
export const TipIcon: React.FC<TipIconProps> = React.memo((props) => {
  const { className, content, onClick } = props;

  return (
    <Tooltip>
      <TooltipTrigger type="button" onClick={onClick}>
        <LuCircleHelp className={className} />
      </TooltipTrigger>

      <TooltipContent className="max-w-xl">{content}</TooltipContent>
    </Tooltip>
  );
});
TipIcon.displayName = 'TipIcon';
