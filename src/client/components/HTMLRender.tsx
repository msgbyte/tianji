import React, { forwardRef } from 'react';
import { cn } from '@/utils/style';

interface HTMLRenderProps extends React.ComponentPropsWithoutRef<'iframe'> {
  html?: string;
  title?: string;
  className?: string;
}

export const HTMLRender = React.memo(forwardRef<HTMLIFrameElement, HTMLRenderProps>((props, ref) => {
  const { html, title, className, srcDoc, style, ...rest } = props;

  // Use html prop for srcDoc if provided, otherwise fallback to srcDoc from props
  const content = html ?? srcDoc;

  // Default sandbox permissions, can be overridden by props
  const defaultSandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation";

  return (
    <iframe
      ref={ref}
      srcDoc={content}
      className={cn("border-0 bg-white", className)}
      title={title}
      sandbox={defaultSandbox}
      style={{ ...style }}
      {...rest}
    />
  );
}));

HTMLRender.displayName = 'HtmlRender';
