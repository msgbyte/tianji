import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    redirect({
      to: context.userInfo ? '/website' : '/login',
    });
  },
});
