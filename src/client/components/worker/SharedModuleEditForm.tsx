import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@i18next-toolkit/react';
import { useForm } from 'react-hook-form';
import { LuArchive, LuCheck, LuRocket } from 'react-icons/lu';
import { z } from 'zod';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CodeEditor } from '@/components/CodeEditor';
import { UserSelect } from '@/components/UserSelect';
import { AlertConfirm } from '@/components/AlertConfirm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  useCurrentWorkspaceId,
  useHasAdminPermission,
} from '@/store/user';

const SHARED_MODULE_ALIAS_PREFIX = '@shared/';

const sharedModuleFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().optional(),
  importAlias: z
    .string()
    .regex(
      /^@shared\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens'
    ),
  source: z.string().min(1, 'Source is required'),
  ownerId: z.cuid2().optional(),
});

export type SharedModuleEditFormValues = z.infer<
  typeof sharedModuleFormSchema
>;

interface SharedModuleEditFormProps {
  moduleId?: string;
  latestRevision?: number;
  archived?: boolean;
  readOnly?: boolean;
  publishing?: boolean;
  defaultValues?: Partial<SharedModuleEditFormValues>;
  onPublish: (values: SharedModuleEditFormValues) => Promise<void>;
  onArchive?: () => Promise<void>;
}

const defaultSource = `export interface Alert {
  title: string;
  message: string;
}

export function formatAlert(alert: Alert): string {
  return \`[\${alert.title}] \${alert.message}\`;
}

export async function sendAlert(alert: Alert): Promise<{ sent: boolean }> {
  const text = formatAlert(alert);
  return { sent: text.length > 0 };
}
`;

export function SharedModuleEditForm(props: SharedModuleEditFormProps) {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const { data: workspaceMembers = [] } = trpc.workspace.members.useQuery(
    { workspaceId },
    { enabled: hasAdminPermission }
  );
  const [validationResult, setValidationResult] = useState<{
    declarationCode: string;
    exportsMetadata: Array<{ name: string; kind: string }>;
  }>();

  const defaultValues = useMemo(
    () => ({
      name: '',
      description: '',
      importAlias: SHARED_MODULE_ALIAS_PREFIX,
      source: defaultSource,
      ...props.defaultValues,
    }),
    [props.defaultValues]
  );
  const form = useForm<SharedModuleEditFormValues>({
    resolver: zodResolver(sharedModuleFormSchema),
    defaultValues,
  });
  const source = form.watch('source');
  const readOnly = Boolean(props.archived || props.readOnly);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  useEffect(() => {
    setValidationResult(undefined);
  }, [source]);

  const validateMutation = trpc.sharedModule.validate.useMutation({
    onError: defaultErrorHandler,
    onSuccess: (result) => {
      setValidationResult(result);
    },
  });

  const validate = async () => {
    const valid = await form.trigger('source');
    if (!valid) return false;
    await validateMutation.mutateAsync({
      workspaceId,
      source,
      moduleId: props.moduleId,
    });
    return true;
  };

  const publish = form.handleSubmit(async (values) => {
    if (!(await validate())) return;
    await props.onPublish(values);
  });

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={publish}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Module Settings')}</CardTitle>
            <CardDescription>
              {t(
                'Shared modules run inside the calling worker and use its request, KV, memory, and timeout budget.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="importAlias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Import Alias')}</FormLabel>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-px left-px z-10 flex select-none items-center rounded-l-md border-r bg-muted/50 px-3 font-mono text-sm text-muted-foreground"
                    >
                      {SHARED_MODULE_ALIAS_PREFIX}
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        value={
                          field.value.startsWith(SHARED_MODULE_ALIAS_PREFIX)
                            ? field.value.slice(
                                SHARED_MODULE_ALIAS_PREFIX.length
                              )
                            : field.value
                        }
                        onChange={(event) => {
                          const nextValue = event.target.value.startsWith(
                            SHARED_MODULE_ALIAS_PREFIX
                          )
                            ? event.target.value.slice(
                                SHARED_MODULE_ALIAS_PREFIX.length
                              )
                            : event.target.value;
                          field.onChange(
                            `${SHARED_MODULE_ALIAS_PREFIX}${nextValue}`
                          );
                        }}
                        readOnly={readOnly || Boolean(props.latestRevision)}
                        className="pl-24 font-mono"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    {props.latestRevision
                      ? t('The alias is immutable after the first publish.')
                      : t('Use lowercase letters, numbers, and hyphens.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel optional>{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} readOnly={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {hasAdminPermission && (
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Owner')}</FormLabel>
                    <UserSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('Select owner')}
                      users={workspaceMembers.map((member) => ({
                        id: member.userId,
                        username: member.user.username,
                        nickname: member.user.nickname,
                        avatar: member.user.avatar,
                      }))}
                      disabled={readOnly}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('TypeScript Source')}</CardTitle>
            <CardDescription>
              {t(
                'Export named functions, constants, and types. Imports inside shared modules are disabled in this release.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CodeEditor
                      height={520}
                      value={field.value}
                      onChange={field.onChange}
                      readOnly={readOnly}
                      language="typescript"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          {!readOnly && (
            <CardFooter className="justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                Icon={LuCheck}
                loading={validateMutation.isPending}
                onClick={validate}
              >
                {t('Validate')}
              </Button>
              <Button
                type="submit"
                Icon={LuRocket}
                loading={validateMutation.isPending || props.publishing}
              >
                {props.moduleId
                  ? t('Publish Revision')
                  : t('Publish Module')}
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Exports and Declaration')}</CardTitle>
            <CardDescription>
              {validationResult
                ? t('Validation passed. The declaration below will be pinned with the revision.')
                : t('Validate the source to generate its public TypeScript declaration.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {validationResult.exportsMetadata.map((item) => (
                    <span
                      key={`${item.kind}:${item.name}`}
                      className="bg-muted rounded-md px-2 py-1 font-mono text-xs"
                    >
                      {item.kind} {item.name}
                    </span>
                  ))}
                </div>
                <pre className="bg-muted max-h-72 overflow-auto rounded-lg p-4 text-xs">
                  {validationResult.declarationCode}
                </pre>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t('No current validation result.')}
              </p>
            )}
          </CardContent>
        </Card>

        {props.moduleId && props.onArchive && !readOnly && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>{t('Archive Module')}</CardTitle>
              <CardDescription>
                {t(
                  'Existing pinned workers keep running, but new bindings and upgrades will be blocked.'
                )}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <AlertConfirm
                title={t('Archive this shared module?')}
                onConfirm={props.onArchive}
              >
                <Button type="button" variant="destructive" Icon={LuArchive}>
                  {t('Archive')}
                </Button>
              </AlertConfirm>
            </CardFooter>
          </Card>
        )}
      </form>
    </Form>
  );
}
