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
function App() {
  const { info } = useUserStore();

  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {info && (
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/monitor" element={<Monitor />} />
                <Route path="/website" element={<Website />} />
                <Route path="/servers" element={<Servers />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            )}

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="*"
              element={
                <Navigate to={info ? '/dashboard' : '/login'} replace={true} />
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;
