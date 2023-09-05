import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './pages/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Monitor } from './pages/Monitor';
import { Website } from './pages/Website';
import { Settings } from './pages/Settings';
import { Servers } from './pages/Servers';
import { useUserStore } from './store/user';
import { Register } from './pages/Register';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/cache';
import { TokenLoginContainer } from './components/TokenLoginContainer';
import React from 'react';

export const AppRoutes: React.FC = React.memo(() => {
  const { info } = useUserStore();

  return (
    <Routes>
      {info ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/website" element={<Website />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>
      ) : (
        <Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      )}

      <Route
        path="*"
        element={
          <Navigate to={info ? '/dashboard' : '/login'} replace={true} />
        }
      />
    </Routes>
  );
});
AppRoutes.displayName = 'AppRoutes';

export const App: React.FC = React.memo(() => {
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TokenLoginContainer>
            <AppRoutes />
          </TokenLoginContainer>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
});
App.displayName = 'App';
