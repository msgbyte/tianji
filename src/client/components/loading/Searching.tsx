import React from 'react';
import Lottie from 'lottie-react';
import searchAnimation from './searching.json';
import { cn } from '@/utils/style';

interface SearchLoadingViewProps {
  className?: string;
}
export const SearchLoadingView: React.FC<SearchLoadingViewProps> = React.memo(
  (props) => {
    return (
      <div className={cn('mx-auto w-[320px]', props.className)}>
        <Lottie animationData={searchAnimation} loop={true} />
      </div>
    );
  }
);
SearchLoadingView.displayName = 'SearchLoadingView';
