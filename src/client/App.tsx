import { BrowserRouter } from 'react-router-dom';
import { useUserStore } from './store/user';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/cache';
import { TokenLoginContainer } from './components/TokenLoginContainer';
import React, { useRef } from 'react';
import { trpc, trpcClient } from './api/trpc';
import { useInjectWebsiteScript } from './hooks/useInjectWebsiteScript';
import { ConfigProvider } from 'antd';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { DefaultNotFound } from './components/DefaultNotFound';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { DefaultError } from './components/DefaultError';
import { useAntdTheme } from './hooks/useTheme';

const router = createRouter({
  routeTree,
  context: {
    userInfo: undefined,
  },
  defaultNotFoundComponent: DefaultNotFound,
  defaultErrorComponent: DefaultError,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const AppRouter: React.FC = React.memo(() => {
  const { info: userInfo } = useUserStore();

  useInjectWebsiteScript();

  return (
    <BrowserRouter>
      {/* Compatible with old routes */}
      <TooltipProvider delayDuration={0}>
        <RouterProvider router={router} context={{ userInfo }} />
      </TooltipProvider>

      <Toaster />
    </BrowserRouter>
  );
});
AppRouter.displayName = 'AppRouter';

export const App: React.FC = React.memo(() => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const theme = useAntdTheme();

  return (
    <div ref={rootRef} className="App">
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={theme}
            getPopupContainer={() => rootRef.current!}
          >
            <TokenLoginContainer>
              <AppRouter />
            </TokenLoginContainer>
          </ConfigProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </div>
  );
});
App.displayName = 'App';
