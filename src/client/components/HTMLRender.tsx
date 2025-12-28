import React, { forwardRef } from 'react';
import { cn } from '@/utils/style';
import { useTheme } from '@/store/settings';
// import { useTheme } from '@/hooks/useTheme';

interface HTMLRenderProps extends React.ComponentPropsWithoutRef<'iframe'> {
  html?: string;
  title?: string;
  className?: string;
  useTianjiTheme?: boolean;
}

export const HTMLRender = React.memo(forwardRef<HTMLIFrameElement, HTMLRenderProps>((props, ref) => {
  const { html, title, className, srcDoc, style, useTianjiTheme = true, ...rest } = props;
  const theme = useTheme();

  // Use html prop for srcDoc if provided, otherwise fallback to srcDoc from props
  const content = React.useMemo(() => {
    const raw = html ?? srcDoc;

    if (!raw) {
      return raw;
    }

    if (!useTianjiTheme) {
      return raw;
    }

    // inject some style for improve display in tianji
    return `
      <style>
        :root {
          color-scheme: ${theme};
        }
      </style>
      ${raw}
    `;
  }, [html, srcDoc, theme, useTianjiTheme]);

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
