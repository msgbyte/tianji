import { FileBaseRouteOptions, redirect } from '@tanstack/react-router';

export const routeAuthBeforeLoad: FileBaseRouteOptions['beforeLoad'] = ({
  context,
  location,
}) => {
  if (!(context as any).userInfo) {
    throw redirect({
      to: '/login',
      search: {
        redirect: location.href,
      },
    });
  }
};
