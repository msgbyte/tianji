import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { DialogWrapper } from '@/components/DialogWrapper';
import { CodeBlock } from '@/components/CodeBlock';
import { Button } from '@/components/ui/button';
import { useCurrentWorkspaceId } from '@/store/user';

export function ArtifactSkillDialog() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const archive = 'https://tianji.dev/skills/tianji-artifacts.tar.gz';
  return (
    <DialogWrapper
      title={t('Install Artifacts Skill')}
      description={t(
        'Let your AI create and update HTML artifacts in this workspace.'
      )}
      content={
        <div className="max-h-[65vh] space-y-3 overflow-auto text-sm">
          <p>{t('Claude Code')}</p>
          <CodeBlock
            code={`mkdir -p ~/.claude/skills\ncurl -fsSL ${archive} | tar -xz -C ~/.claude/skills`}
          />
          <p>{t('Codex')}</p>
          <CodeBlock
            code={`mkdir -p ~/.agents/skills\ncurl -fsSL ${archive} | tar -xz -C ~/.agents/skills`}
          />
          <p>
            {t(
              'Set these variables in the environment where your agent runs, then restart the agent.'
            )}
          </p>
          <CodeBlock
            code={`export TIANJI_SERVER_URL="${window.location.origin}"\nexport TIANJI_WORKSPACE_ID="${workspaceId}"\nexport TIANJI_API_KEY="<your-api-key>"`}
          />
          <p>
            {t(
              'Use your own API key. Workspace permissions apply to every upload.'
            )}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              className="underline"
              href="/settings/apiKey"
              target="_blank"
              rel="noreferrer"
            >
              {t('API Keys')}
            </a>
            <a
              className="underline"
              href="https://tianji.dev/docs/artifacts"
              target="_blank"
              rel="noreferrer"
            >
              {t('Documentation')}
            </a>
          </div>
        </div>
      }
    >
      <Button variant="outline" size="sm">
        {t('Install Skill')}
      </Button>
    </DialogWrapper>
  );
}
