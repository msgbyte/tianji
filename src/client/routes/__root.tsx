import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

interface RouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  userInfo: any;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </>
    );
  },
});
