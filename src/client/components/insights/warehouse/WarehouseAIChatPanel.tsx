import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { AIChatbot } from '@/components/ai/AIChatbot';
import { useWarehouseSqlChat } from '@/hooks/useWarehouseSqlChat';
import { AppRouterOutput } from '@/api/trpc';

type DatabaseType =
  AppRouterOutput['insights']['warehouse']['database']['list'][number];

interface WarehouseAIChatPanelProps {
  workspaceId: string;
  database: DatabaseType;
  currentSelectedSql: string | null;
  onSQLGenerated?: (sql: string) => void;
}

export const WarehouseAIChatPanel: React.FC<WarehouseAIChatPanelProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    const {
      messages,
      status,
      input,
      setInput,
      usage,
      addToolResult,
      handleReset,
      handleSend,
      handleRegenerate,
    } = useWarehouseSqlChat({
      workspaceId: props.workspaceId,
      selectedScopes: [
        {
          type: 'database',
          id: props.database.id,
          name: props.database.name,
        },
      ],
      currentSelectedSql: props.currentSelectedSql,
      onSQLGenerated: props.onSQLGenerated,
    });

    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">{t('AI Assistant')}</h3>
          <p className="text-muted-foreground text-xs">
            {t('AI-powered SQL query generation')}
          </p>
        </div>

        <AIChatbot
          className="flex-1 overflow-hidden"
          messages={messages}
          status={status}
          input={input}
          setInput={setInput}
          usage={usage}
          onAddToolResult={addToolResult}
          onSubmit={handleSend}
          onReset={handleReset}
          onRegenerate={handleRegenerate}
        />
      </div>
    );
  });
WarehouseAIChatPanel.displayName = 'WarehouseAIChatPanel';
