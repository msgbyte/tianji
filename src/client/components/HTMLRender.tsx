import React, { forwardRef } from 'react';
import { cn } from '@/utils/style';
import { useTheme } from '@/store/settings';
import { useIsMount } from '@/hooks/useIsMount';
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
  const isMount = useIsMount();

  // Use html prop for srcDoc if provided, otherwise fallback to srcDoc from props
  const content = React.useMemo(() => {
    const raw = html ?? srcDoc;

    if (typeof raw !== 'string') {
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
      className={cn("border-0", isMount ? 'bg-white' : 'bg-transparent', className)}
      title={title}
      sandbox={defaultSandbox}
      style={{ ...style }}
      {...rest}
    />
  );
}));
HTMLRender.displayName = 'HtmlRender';
