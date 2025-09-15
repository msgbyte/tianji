import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc, defaultSuccessHandler, defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { useState, useEffect } from 'react';
import { CommonHeader } from '@/components/CommonHeader';
import { Button } from '@/components/ui/button';
import { LuCircleAlert } from 'react-icons/lu';
import {
  getWarehouseConfigJsonSchema,
  validateWarehouseConfig,
  defaultWarehouseConfig,
  exampleWarehouseConfig,
} from '@tianji/shared';
import { JsonEditor } from '@/components/CodeEditor';

export const Route = createFileRoute('/settings/warehouse')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const [openWarehouseConfig, setOpenWarehouseConfig] = useState(false);
  const [warehouseConfigJson, setWarehouseConfigJson] = useState('');
  const [configErrors, setConfigErrors] = useState<string[]>([]);

  const { data: warehouseConfig, refetch: refetchWarehouseConfig } =
    trpc.workspace.config.getConfig.useQuery(
      {
        workspaceId,
        key: 'warehouse',
      },
      {
        enabled: hasAdminPermission,
      }
    );

  const setWarehouseConfigMutation =
    trpc.workspace.config.setConfig.useMutation({
      onSuccess: () => {
        defaultSuccessHandler();
        refetchWarehouseConfig();
        setOpenWarehouseConfig(false);
      },
      onError: defaultErrorHandler,
    });

  // Initialize warehouse config when data loads
  useEffect(() => {
    if (warehouseConfig) {
      setWarehouseConfigJson(JSON.stringify(warehouseConfig, null, 2));
    } else {
      setWarehouseConfigJson(JSON.stringify(defaultWarehouseConfig, null, 2));
    }
  }, [warehouseConfig]);

  const handleWarehouseConfigChange = (value: string) => {
    setWarehouseConfigJson(value);

    // Clear previous errors when input changes
    if (configErrors.length > 0) {
      setConfigErrors([]);
    }
  };

  const handleSaveWarehouseConfig = async () => {
    try {
      const parsed = JSON.parse(warehouseConfigJson);
      const validation = validateWarehouseConfig(parsed);

      if (!validation.isValid) {
        setConfigErrors(validation.errors);
        return;
      }

      await setWarehouseConfigMutation.mutateAsync({
        workspaceId,
        key: 'warehouse',
        value: parsed,
      });
    } catch (error) {
      setConfigErrors(['Invalid JSON format']);
    }
  };

  const currentWarehouseEnabled = warehouseConfig?.enabled || false;

  if (!hasAdminPermission) {
    return (
      <CommonWrapper header={<CommonHeader title={t('Warehouse')} />}>
        <div className="p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-base">
                {t(
                  'You do not have permission to access warehouse configuration.'
                )}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {t('Please contact your workspace administrator for access.')}
              </p>
            </CardContent>
          </Card>
        </div>
      </CommonWrapper>
    );
  }

  return (
    <CommonWrapper header={<CommonHeader title={t('Warehouse')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="mb-2">
                    {t('Warehouse Configuration')}
                  </CardTitle>
                  <p className="text-muted-foreground text-base">
                    {t(
                      'Configure warehouse data insights functionality for this workspace. Warehouse allows you to connect external databases and create custom analytics applications.'
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="warehouse-enabled">{t('Enable')}</Label>
                  <Switch
                    id="warehouse-enabled"
                    checked={currentWarehouseEnabled}
                    onCheckedChange={(enabled) => {
                      const newConfig = { ...defaultWarehouseConfig, enabled };
                      setWarehouseConfigMutation.mutate({
                        workspaceId,
                        key: 'warehouse',
                        value: newConfig,
                      });
                    }}
                    disabled={setWarehouseConfigMutation.isPending}
                  />
                </div>
              </div>
            </CardHeader>

            {currentWarehouseEnabled && (
              <CardContent className="border-t pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="block text-base font-semibold">
                      {t('Application Configuration')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(
                        'Manage warehouse application connections and schemas'
                      )}
                    </p>
                  </div>
                  <Button onClick={() => setOpenWarehouseConfig(true)}>
                    {t('Configure Applications')}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="bg-card rounded-lg border p-4">
                    <p className="block font-semibold">{t('Applications')}</p>
                    <h3 className="mb-0 text-2xl font-bold">
                      {warehouseConfig?.applications?.length || 0}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('Configured applications')}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border p-4">
                    <p className="block font-semibold">
                      {t('Long Table Apps')}
                    </p>
                    <h3 className="mb-0 text-2xl font-bold">
                      {warehouseConfig?.applications?.filter(
                        (app: any) => app.type === 'longTable'
                      )?.length || 0}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('Event-based applications')}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border p-4">
                    <p className="block font-semibold">
                      {t('Wide Table Apps')}
                    </p>
                    <h3 className="mb-0 text-2xl font-bold">
                      {warehouseConfig?.applications?.filter(
                        (app: any) => app.type === 'wideTable'
                      )?.length || 0}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('Metric-based applications')}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Info Cards */}
          {!currentWarehouseEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>{t('About Warehouse')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-1 block font-semibold">
                      {t('What is Warehouse?')}
                    </h4>
                    <p className="text-muted-foreground">
                      {t(
                        'Warehouse is a powerful feature that allows you to connect external databases and create custom analytics applications. You can analyze user behavior, track metrics, and generate insights from your data.'
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 block font-semibold">
                      {t('Supported Application Types')}
                    </h4>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>
                        <span className="text-muted-foreground">
                          <strong>{t('Long Table')}:</strong>{' '}
                          {t(
                            'Event-based analytics with separate event and parameter tables'
                          )}
                        </span>
                      </li>
                      <li>
                        <span className="text-muted-foreground">
                          <strong>{t('Wide Table')}:</strong>{' '}
                          {t(
                            'Metric-based analytics with denormalized data structure'
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration Dialog */}
          <Dialog
            open={openWarehouseConfig}
            onOpenChange={(open) => {
              setOpenWarehouseConfig(open);
              if (!open) {
                setConfigErrors([]);
              }
            }}
          >
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {t('Warehouse Application Configuration')}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 space-y-4 overflow-hidden">
                <div>
                  <h3 className="mb-2 block text-base font-semibold">
                    {t('JSON Configuration')}
                  </h3>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">
                        {t(
                          'Configure warehouse applications using JSON format. The schema provides auto-completion and validation to help you create valid configurations.'
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setWarehouseConfigJson(
                          JSON.stringify(exampleWarehouseConfig, null, 2)
                        );
                        setConfigErrors([]);
                      }}
                    >
                      {t('Load Example')}
                    </Button>
                  </div>
                </div>

                {configErrors.length > 0 && (
                  <Alert variant="destructive">
                    <LuCircleAlert className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {t('Configuration Errors')}
                        </p>
                        {configErrors.map((error, index) => (
                          <div key={index} className="text-sm">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <JsonEditor
                  value={warehouseConfigJson}
                  onChange={handleWarehouseConfigChange}
                  schema={getWarehouseConfigJsonSchema()}
                  height={500}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenWarehouseConfig(false);
                    setConfigErrors([]);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  disabled={
                    configErrors.length > 0 ||
                    setWarehouseConfigMutation.isPending
                  }
                  onClick={handleSaveWarehouseConfig}
                >
                  {setWarehouseConfigMutation.isPending
                    ? t('Saving...')
                    : t('Save Configuration')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
