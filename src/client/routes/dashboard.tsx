import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    redirect({
      to: '/',
    });
  },
});
