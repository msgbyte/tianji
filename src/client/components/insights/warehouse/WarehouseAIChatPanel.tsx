import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { LuSparkles } from 'react-icons/lu';

interface WarehouseAIChatPanelProps {
  workspaceId: string;
  databaseId: string;
  onSQLGenerated?: (sql: string) => void;
}

export const WarehouseAIChatPanel: React.FC<WarehouseAIChatPanelProps> =
  React.memo(() => {
    const { t } = useTranslation();

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">{t('AI Assistant')}</h3>
          <p className="text-muted-foreground text-xs">
            {t('AI-powered SQL query generation')}
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
            <LuSparkles className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">{t('Coming Soon')}</h4>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t(
                'AI-powered SQL query generation and assistance will be available soon. Stay tuned!'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  });
WarehouseAIChatPanel.displayName = 'WarehouseAIChatPanel';
