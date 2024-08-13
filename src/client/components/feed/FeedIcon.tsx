import React from 'react';
import { LuCloudy, LuGithub, LuPlug } from 'react-icons/lu';
import { RiSurveyLine } from 'react-icons/ri';

interface FeedIconProps {
  source: string;
  size: number;
}
export const FeedIcon: React.FC<FeedIconProps> = React.memo((props) => {
  if (props.source === 'github') {
    return <LuGithub size={props.size} />;
  }
  if (props.source === 'tencent-cloud') {
    return <LuCloudy size={props.size} />;
  }
  if (props.source === 'survey') {
    return <RiSurveyLine size={props.size} />;
  }

  return <LuPlug size={props.size} />;
});
FeedIcon.displayName = 'FeedIcon';
