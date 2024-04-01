import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Suspense } from 'react';

interface RouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  userInfo: any;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    return (
      // https://github.com/TanStack/router/issues/857
      <Suspense fallback={null}>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    );
  },
});
