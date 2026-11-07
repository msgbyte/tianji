import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Layout } from '@/components/layout';
import { ArtifactList } from '@/components/artifact/ArtifactList';

export const Route = createFileRoute('/artifacts')({
  beforeLoad: routeAuthBeforeLoad,
  component: () => <Layout list={<ArtifactList />} />,
});
