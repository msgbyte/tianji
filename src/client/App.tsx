import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './pages/Layout';
import { DashboardPage } from './pages/Dashboard';
import { Login } from './pages/Login';
import { SettingsPage } from './pages/Settings';
import { Servers } from './pages/Servers';
import { useUserStore } from './store/user';
import { Register } from './pages/Register';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/cache';
import { TokenLoginContainer } from './components/TokenLoginContainer';
import React, { useRef } from 'react';
import { trpc, trpcClient } from './api/trpc';
import { MonitorPage } from './pages/Monitor';
import { WebsitePage } from './pages/Website';
import { useGlobalConfig } from './hooks/useConfig';
import { useInjectWebsiteScript } from './hooks/useInjectWebsiteScript';
import { ConfigProvider, theme } from 'antd';
import { useColorSchema } from './store/settings';
import { StatusPage } from './pages/Status';
import { TelemetryPage } from './pages/Telemetry';
import { LayoutV2 } from './pages/LayoutV2';
import { isDev } from './utils/env';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  context: {
    userInfo: undefined,
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const AppRoutes: React.FC = React.memo(() => {
  const { info: userInfo } = useUserStore();
  const { allowRegister } = useGlobalConfig();

  useInjectWebsiteScript();

  return (
    <Routes>
      {userInfo ? (
        <Route element={isDev ? <LayoutV2 /> : <Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitor/*" element={<MonitorPage />} />
          <Route path="/website/*" element={<WebsitePage />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/telemetry/*" element={<TelemetryPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
        </Route>
      ) : (
        <Route>
          <Route path="/login" element={<Login />} />
          {allowRegister && <Route path="/register" element={<Register />} />}
        </Route>
      )}

      <Route path="/status/:slug" element={<StatusPage />} />

      <Route
        path="*"
        element={
          <Navigate to={userInfo ? '/dashboard' : '/login'} replace={true} />
        }
      />
    </Routes>
  );
});
AppRoutes.displayName = 'AppRoutes';

export const App: React.FC = React.memo(() => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const colorScheme = useColorSchema();
  const algorithm =
    colorScheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const { info: userInfo } = useUserStore();

  return (
    <div ref={rootRef} className="App">
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{ algorithm }}
            getPopupContainer={() => rootRef.current!}
          >
            <TokenLoginContainer>
              {isDev ? (
                <RouterProvider router={router} context={{ userInfo }} />
              ) : (
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              )}
            </TokenLoginContainer>
          </ConfigProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </div>
  );
});
App.displayName = 'App';
