import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEventWithLoading } from '@/hooks/useEvent';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { FullscreenModal } from '@/components/ui/fullscreen-modal';
import {
  LuMaximize2,
  LuPlay,
  LuClock,
  LuTriangleAlert,
  LuExternalLink,
} from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { WorkerExecutionDetail } from '@/components/worker/WorkerExecutionDetail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchValidator, ValidatorFn } from '../CodeEditor/validator/fetch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '../ui/spinner';
import { useCronPreview } from './useCronPreview';
import { useNavigate } from '@tanstack/react-router';

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    code: z.string().min(1, 'Code is required'),
    active: z.boolean().default(true),
    enableCron: z.boolean().default(false),
    cronExpression: z.string().optional(),
    visibility: z.enum(['Public', 'Private']).default('Public'),
  })
  .refine(
    (data) => {
      if (data.enableCron && !data.cronExpression) {
        return false;
      }
      return true;
    },
    {
      message: 'Cron expression is required when cron is enabled',
      path: ['cronExpression'],
    }
  );

const defaultCode = `async function fetch(payload, ctx) {
  return 'Hello, World!';
}
`;

export type WorkerEditFormValues = z.infer<typeof formSchema>;

interface WorkerEditFormProps {
  workerId?: string;
  defaultValues?: Partial<WorkerEditFormValues>;
  onSubmit: (values: WorkerEditFormValues) => Promise<void>;
}

const codeValidator: ValidatorFn[] = [fetchValidator];

export const WorkerEditForm: React.FC<WorkerEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [showTestResult, setShowTestResult] = useState(false);
    const navigate = useNavigate();

    const form = useForm<WorkerEditFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        description: '',
        code: defaultCode,
        active: true,
        enableCron: false,
        cronExpression: '',
        visibility: 'Public',
        ...props.defaultValues,
      },
    });

    const enableCron = form.watch('enableCron');
    const cronExpressionValue = form.watch('cronExpression');

    const {
      previewTimes: cronPreviewTimes,
      error: cronPreviewError,
      isLoading: isCronPreviewLoading,
      validate: validateCronPreview,
    } = useCronPreview({
      cronExpression: cronExpressionValue,
      enabled: enableCron,
      onInvalidExpression: () => {
        form.setError('cronExpression', {
          type: 'manual',
          message: t('Please input cron expression'),
        });
      },
    });

    const testCodeMutation = trpc.worker.testCode.useMutation({
      onError: defaultErrorHandler,
      onSuccess: (result) => {
        setTestResult(result);
        setShowTestResult(true);
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: WorkerEditFormValues) => {
        if (enableCron) {
          await validateCronPreview();
        }

        await props.onSubmit(values);
      }
    );

    const [handleTestCode, isTestLoading] = useEventWithLoading(async () => {
      const code = form.getValues('code');
      await testCodeMutation.mutateAsync({
        workspaceId,
        code,
      });
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Enter worker name')} />
                    </FormControl>
                    <FormDescription>
                      {t('A descriptive name for this worker')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('Enter worker description')}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Optional description of what this worker does')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      {t('JavaScript Code')}
                      {!props.workerId && (
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            Icon={LuPlay}
                            onClick={handleTestCode}
                            loading={isTestLoading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            Icon={LuMaximize2}
                            onClick={() => setIsFullscreen(true)}
                          />
                        </div>
                      )}
                    </FormLabel>
                    <FormControl>
                      {props.workerId ? (
                        <div className="relative h-64">
                          <div className="bg-background/95 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 text-center">
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">
                                  {t('Use Advanced Editor for Code Editing')}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  {t(
                                    'For better code editing experience with live preview and testing, please use the dedicated code editor.'
                                  )}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="lg"
                                Icon={LuExternalLink}
                                onClick={() => {
                                  navigate({
                                    to: '/worker/$workerId/editor',
                                    params: { workerId: props.workerId },
                                    replace: true,
                                  });
                                }}
                              >
                                {t('Go to Code Editor')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <CodeEditor
                          height={680}
                          value={field.value}
                          onChange={field.onChange}
                          codeValidator={codeValidator}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('Private Worker')}
                      </FormLabel>
                      <FormDescription>
                        {t(
                          'When enabled, this worker can only be accessed by workspace members. Public workers can be accessed by anyone with the link.'
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'Private'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'Private' : 'Public')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-4 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="enableCron"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('Enable Cron Schedule')}
                        </FormLabel>
                        <FormDescription>
                          {t('Automatically execute this worker on a schedule')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {enableCron && (
                  <FormField
                    control={form.control}
                    name="cronExpression"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Cron Expression')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0 */5 * * * *"
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription className="space-y-2">
                          <div>
                            {t(
                              'Enter a cron expression to define when the worker should run automatically.'
                            )}
                          </div>
                          <div>
                            <div className="mb-2 text-sm font-medium">
                              {t('Common Examples:')}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[
                                {
                                  expr: '0 */5 * * * *',
                                  desc: t('Every 5 minutes'),
                                },
                                { expr: '0 0 * * * *', desc: t('Every hour') },
                                {
                                  expr: '0 0 9 * * *',
                                  desc: t('Daily at 9 AM'),
                                },
                                {
                                  expr: '0 0 9 * * 1',
                                  desc: t('Weekly on Monday at 9 AM'),
                                },
                                {
                                  expr: '0 0 9 1 * *',
                                  desc: t('Monthly on 1st at 9 AM'),
                                },
                              ].map((example) => (
                                <Badge
                                  key={example.expr}
                                  variant="outline"
                                  className="hover:bg-accent cursor-pointer"
                                  onClick={() =>
                                    form.setValue(
                                      'cronExpression',
                                      example.expr
                                    )
                                  }
                                >
                                  {example.desc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </FormDescription>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={validateCronPreview}
                            disabled={isCronPreviewLoading}
                          >
                            {t('Validate and Preview')}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {isCronPreviewLoading && <Spinner />}

                          {cronPreviewError && (
                            <Alert
                              variant="destructive"
                              className="flex items-start gap-2"
                            >
                              <LuTriangleAlert className="mt-1 h-4 w-4" />
                              <AlertDescription>
                                {cronPreviewError}
                              </AlertDescription>
                            </Alert>
                          )}

                          {!cronPreviewError && cronPreviewTimes.length > 0 && (
                            <Alert className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <LuClock className="h-4 w-4" />
                                <span className="font-medium">
                                  {t('Upcoming scheduled run times')}
                                </span>
                              </div>
                              <AlertDescription>
                                <ul className="space-y-1 text-sm">
                                  {cronPreviewTimes.map((time) => (
                                    <li key={time} className="font-mono">
                                      {time}
                                    </li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {props.workerId ? t('Update Worker') : t('Create Worker')}
              </Button>
            </CardFooter>
          </Card>

          <FullscreenModal
            isOpen={isFullscreen}
            onClose={() => setIsFullscreen(false)}
            title={t('JavaScript Code Editor')}
          >
            <CodeEditor
              height="100%"
              value={form.watch('code')}
              onChange={(value) => form.setValue('code', value)}
              codeValidator={codeValidator}
            />
          </FullscreenModal>

          <Dialog open={showTestResult} onOpenChange={setShowTestResult}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t('Test Result')}</DialogTitle>
              </DialogHeader>
              {testResult && <WorkerExecutionDetail execution={testResult} />}
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    );
  }
);

WorkerEditForm.displayName = 'WorkerEditForm';
