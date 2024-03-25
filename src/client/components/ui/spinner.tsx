import { cn } from '@/utils/style';
import React from 'react';
import { IconBaseProps } from 'react-icons';
import { LuLoader } from 'react-icons/lu';

interface SpinnerProps extends IconBaseProps {}
export const Spinner: React.FC<SpinnerProps> = React.memo((props) => {
  return (
    <LuLoader {...props} className={cn('animate-spin', props.className)} />
  );
});
Spinner.displayName = 'Spinner';
