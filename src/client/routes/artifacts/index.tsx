import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { ArtifactSkillDialog } from '@/components/artifact/ArtifactSkillDialog';

export const Route = createFileRoute('/artifacts/')({
  component: ArtifactsWelcome,
});

function ArtifactsWelcome() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('Artifacts')}</h1>
      <p className="text-muted-foreground max-w-md">
        {t(
          'Publish interactive HTML with your AI, then view and share it with members of this workspace. Select an artifact to open it.'
        )}
      </p>
      <ArtifactSkillDialog />
    </div>
  );
}
