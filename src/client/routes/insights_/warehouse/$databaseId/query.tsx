import React, { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useCurrentWorkspaceId } from '@/store/user';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Button } from '@/components/ui/button';
import { SQLEditor } from '@/components/CodeEditor/sql';
import { trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { routeAuthBeforeLoad } from '@/utils/route';
import { LuArrowLeft, LuTable2 } from 'react-icons/lu';
import { Allotment } from 'allotment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { QueryResultTable } from '@/components/insights/warehouse/QueryResultTable';
import { QueryResultChart } from '@/components/insights/warehouse/QueryResultChart';
import { WarehouseAIChatPanel } from '@/components/insights/warehouse/WarehouseAIChatPanel';
import { useLocalStorageState } from 'ahooks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from '@/components/CodeBlock';

import 'allotment/dist/style.css';

interface QueryResult {
  columns: Array<{ name: string; type: string }>;
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

export const Route = createFileRoute('/insights/warehouse/$databaseId/query')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { databaseId } = Route.useParams<{ databaseId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useCurrentWorkspaceId();

  const [sql, setSql] = useLocalStorageState<string>(
    `tianji-warehouse-sql-${databaseId}`,
    {
      defaultValue: 'SELECT * FROM your_table LIMIT 10;',
    }
  );
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [showDDLSheet, setShowDDLSheet] = useState(false);

  const { data: database, isLoading: isLoadingDatabase } =
    trpc.insights.warehouse.database.list.useQuery({
      workspaceId,
    });

  const { data: tables } = trpc.insights.warehouse.table.list.useQuery({
    workspaceId,
  });

  const executeMutation = trpc.insights.warehouse.query.execute.useMutation({
    onSuccess: (data) => {
      setQueryResult(data);
      setActiveTab('table');
      toast.success(
        t('Query executed successfully: {{count}} rows', {
          count: data.rowCount,
        })
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExecuteSQL = useEvent(async () => {
    if (!sql?.trim()) {
      toast.error(t('Please enter a SQL query'));
      return;
    }

    await executeMutation.mutateAsync({
      workspaceId,
      databaseId,
      sql: sql.trim(),
    });
  });

  const handleExecuteLine = useEvent(
    async (lineNumber: number, sql: string) => {
      if (!sql?.trim()) {
        toast.error(t('Please enter a SQL query'));
        return;
      }

      await executeMutation.mutateAsync({
        workspaceId,
        databaseId,
        sql: sql.trim(),
      });
    }
  );

  const handleSQLGenerated = useEvent((generatedSql: string) => {
    setSql(generatedSql);
  });

  const handleNavigateBack = useEvent(() => {
    navigate({
      to: '/insights/warehouse/connections/',
    });
  });

  // Get current database tables with DDL
  const currentDatabaseTables = useMemo(() => {
    return tables?.filter((t) => t.databaseId === databaseId) || [];
  }, [tables, databaseId]);

  // Transform tables to SQLEditor format
  const tableSchemas = useMemo(() => {
    return currentDatabaseTables.map((t) => {
      // Parse DDL to extract columns (simple parser)
      const columns: Array<{
        name: string;
        type: string;
        description?: string;
      }> = [];

      // Try to extract columns from DDL
      const ddlLines = t.ddl.split('\n');
      for (const line of ddlLines) {
        const match = line.match(/`(\w+)`\s+(\w+)/);
        if (match) {
          columns.push({
            name: match[1],
            type: match[2],
            description: t.description,
          });
        }
      }

      return {
        name: t.name,
        columns,
      };
    });
  }, [currentDatabaseTables]);

  if (isLoadingDatabase) {
    return <Loading />;
  }

  const currentDatabase = database?.find((db) => db.id === databaseId);

  if (!currentDatabase) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper>
      <div className="bg-background flex h-screen flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                Icon={LuArrowLeft}
                onClick={handleNavigateBack}
              />
              <div>
                <h1 className="text-lg font-semibold">
                  {currentDatabase.name} - {t('SQL Query')}
                </h1>
                <p className="text-muted-foreground text-xs">
                  {currentDatabase.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                Icon={LuTable2}
                onClick={() => setShowDDLSheet(true)}
              >
                {t('Tables')} ({currentDatabaseTables.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <Allotment>
            {/* Left panel: SQL Editor and Results */}
            <Allotment.Pane>
              <Allotment vertical={true}>
                {/* SQL Editor */}
                <Allotment.Pane minSize={200} preferredSize="40%">
                  <div className="h-full">
                    <SQLEditor
                      value={sql ?? ''}
                      onChange={setSql}
                      enableRunButton={true}
                      onExecuteLine={handleExecuteLine}
                      tables={tableSchemas}
                      height="100%"
                    />
                  </div>
                </Allotment.Pane>

                {/* Query Results */}
                <Allotment.Pane minSize={200}>
                  <div className="h-full p-1">
                    {queryResult ? (
                      <Tabs
                        value={activeTab}
                        onValueChange={(val) =>
                          setActiveTab(val as 'table' | 'chart')
                        }
                        className="flex h-full flex-col overflow-hidden"
                      >
                        <div className="px-2">
                          <TabsList>
                            <TabsTrigger value="table">
                              {t('Table')}
                            </TabsTrigger>
                            <TabsTrigger value="chart">
                              {t('Chart')}
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent
                          value="table"
                          className="mt-0 flex-1 overflow-hidden"
                        >
                          <QueryResultTable
                            columns={queryResult.columns}
                            rows={queryResult.rows}
                            rowCount={queryResult.rowCount}
                            executionTime={queryResult.executionTime}
                          />
                        </TabsContent>

                        <TabsContent
                          value="chart"
                          className="mt-0 flex-1 overflow-hidden"
                        >
                          <QueryResultChart
                            columns={queryResult.columns}
                            rows={queryResult.rows}
                          />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center">
                        {executeMutation.isPending
                          ? t('Executing query...')
                          : t('Execute a query to see results')}
                      </div>
                    )}
                  </div>
                </Allotment.Pane>
              </Allotment>
            </Allotment.Pane>

            {/* Right panel: AI Chat */}
            <Allotment.Pane preferredSize={400} minSize={300} snap={true}>
              <WarehouseAIChatPanel
                workspaceId={workspaceId}
                databaseId={databaseId}
                onSQLGenerated={handleSQLGenerated}
              />
            </Allotment.Pane>
          </Allotment>
        </div>

        {/* DDL Sheet */}
        <Sheet open={showDDLSheet} onOpenChange={setShowDDLSheet}>
          <SheetContent className="flex w-[600px] max-w-[90vw] flex-col sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>
                {t('Database Tables')} - {currentDatabase.name}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {currentDatabaseTables.length === 0 ? (
                  <div className="text-muted-foreground flex h-32 items-center justify-center text-center text-sm">
                    {t('No tables found in this database')}
                  </div>
                ) : (
                  currentDatabaseTables.map((table) => (
                    <div key={table.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{table.name}</h4>
                        {table.description && (
                          <span className="text-muted-foreground text-xs">
                            {table.description}
                          </span>
                        )}
                      </div>

                      {table.ddl ? (
                        <div className="overflow-hidden rounded-md border">
                          <CodeBlock code={table.ddl} />
                        </div>
                      ) : (
                        <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                          {t('No DDL available for this table')}
                        </div>
                      )}

                      {table.prompt && (
                        <div className="text-muted-foreground bg-muted rounded-md p-3 text-xs">
                          <div className="mb-1 font-medium">
                            {t('AI Prompt')}:
                          </div>
                          <div>{table.prompt}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </CommonWrapper>
  );
}
