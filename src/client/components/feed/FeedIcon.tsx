import React from 'react';
import { LuGithub, LuPlug } from 'react-icons/lu';

interface FeedIconProps {
  source: string;
  size: number;
}
export const FeedIcon: React.FC<FeedIconProps> = React.memo((props) => {
  if (props.source === 'github') {
    return <LuGithub size={props.size} />;
  }

  return <LuPlug size={props.size} />;
});
FeedIcon.displayName = 'FeedIcon';
