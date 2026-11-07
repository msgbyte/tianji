import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ArtifactDetail } from '@/components/artifact/ArtifactDetail';

export const Route = createFileRoute('/artifacts/$artifactId/')({
  validateSearch: (
    search: Record<string, unknown>
  ): { workspaceId?: string } => ({
    workspaceId:
      typeof search.workspaceId === 'string' ? search.workspaceId : undefined,
  }),
  component: ArtifactPage,
});

function ArtifactPage() {
  const { artifactId } = Route.useParams();
  const { workspaceId } = Route.useSearch();
  return <ArtifactDetail artifactId={artifactId} workspaceId={workspaceId} />;
}
