import { UserLoginInfo } from '@/store/user';
import { FileBaseRouteOptions, redirect } from '@tanstack/react-router';

export const routeAuthBeforeLoad: FileBaseRouteOptions['beforeLoad'] = ({
  context,
  location,
}) => {
  const userInfo: UserLoginInfo | undefined = (context as any).userInfo;
  if (!userInfo) {
    throw redirect({
      to: '/login',
      search: {
        redirect: location.href,
      },
    });
  }

  if (
    !userInfo.currentWorkspaceId ||
    userInfo.workspaces.every(
      (w) => w.workspace.id !== userInfo.currentWorkspaceId
    )
  ) {
    throw redirect({
      to: '/switchWorkspace',
      search: {
        redirect: location.href,
      },
    });
  }
};
