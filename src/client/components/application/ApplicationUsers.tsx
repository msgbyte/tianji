import React, { useEffect, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc, type AppRouterInput } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls } from '@/components/PaginationControls';
import { Loading } from '@/components/Loading';

type UserFilter = AppRouterInput['application']['users']['filter'];
const pageSize = 20;

export function ApplicationUsers({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [field, setField] = useState('');
  const [valueType, setValueType] = useState('boolean');
  const [value, setValue] = useState('true');
  const [filter, setFilter] = useState<UserFilter>();
  const [page, setPage] = useState(1);
  const fields = trpc.application.userFields.useQuery({
    workspaceId,
    applicationId,
  });
  const users = trpc.application.users.useQuery({
    workspaceId,
    applicationId,
    page,
    pageSize,
    filter,
  });
  const validValue =
    valueType !== 'number' ||
    (value.trim() !== '' && Number.isFinite(Number(value)));
  const busy = users.isFetching || fields.isFetching;

  useEffect(() => {
    if (users.data) {
      const lastPage = Math.max(1, users.data.totalPages);
      if (page > lastPage) setPage(lastPage);
    }
  }, [users.data, page]);

  function applyFilter(event: React.FormEvent) {
    event.preventDefault();
    if (!field || !validValue) return;
    setFilter({
      field,
      value:
        valueType === 'boolean'
          ? value === 'true'
          : valueType === 'number'
            ? Number(value)
            : valueType === 'null'
              ? null
              : value,
    });
    setPage(1);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{t('User properties')}</CardTitle>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              void fields.refetch();
              void users.refetch();
            }}
          >
            {t('Refresh')}
          </Button>
        </div>
        <CardDescription>
          {t(
            'Count each user ID once using its latest Identify properties. These totals include all identified users, regardless of the overview date range.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-2">
          <div className="w-full space-y-1 sm:w-64">
            <label htmlFor="identify-field" className="text-sm font-medium">
              {t('Identify field')}
            </label>
            <Input
              id="identify-field"
              list="identify-field-suggestions"
              aria-describedby="identify-field-hint"
              value={field}
              maxLength={500}
              placeholder={t('Select or enter a field')}
              onChange={(event) => setField(event.target.value)}
            />
            <datalist id="identify-field-suggestions">
              {fields.data?.map((key) => <option key={key} value={key} />)}
            </datalist>
          </div>
          <span className="text-muted-foreground py-2 text-sm">
            {t('equals')}
          </span>
          <div className="w-36 space-y-1">
            <label htmlFor="identify-type" className="text-sm font-medium">
              {t('Value type')}
            </label>
            <Select
              value={valueType}
              onValueChange={(type) => {
                setValueType(type);
                setValue(type === 'boolean' ? 'true' : '');
              }}
            >
              <SelectTrigger id="identify-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">{t('Boolean')}</SelectItem>
                <SelectItem value="string">{t('String')}</SelectItem>
                <SelectItem value="number">{t('Number')}</SelectItem>
                <SelectItem value="null">{t('Null')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {valueType !== 'null' && (
            <div className="w-full space-y-1 sm:w-48">
              <label htmlFor="identify-value" className="text-sm font-medium">
                {t('Value')}
              </label>
              {valueType === 'boolean' ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger id="identify-value">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="identify-value"
                  value={value}
                  maxLength={500}
                  type={valueType === 'number' ? 'number' : 'text'}
                  step="any"
                  onChange={(event) => setValue(event.target.value)}
                />
              )}
            </div>
          )}
          <Button
            type="submit"
            disabled={!field || !validValue || users.isFetching}
          >
            {t('Apply filter')}
          </Button>
          {filter && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setFilter(undefined);
                setPage(1);
              }}
            >
              {t('Clear filter')}
            </Button>
          )}
        </form>
        <p id="identify-field-hint" className="text-muted-foreground text-sm">
          {t(
            'Suggestions come from recently identified users. You can also enter a field name.'
          )}
        </p>

        {fields.isError && (
          <p role="alert" className="text-destructive text-sm">
            {t(
              'Could not load field suggestions. Enter a field name to filter.'
            )}
          </p>
        )}
        {users.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {t('Could not load users. Please try refreshing.')}
          </p>
        ) : users.isLoading ? (
          <Loading />
        ) : (
          users.data && (
            <>
              <div
                className="flex flex-wrap items-start gap-8"
                aria-live="polite"
              >
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('Matching users')}
                  </p>
                  <p className="text-3xl font-semibold tabular-nums">
                    {users.data.total.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground mt-1 break-all text-xs">
                    {filter
                      ? `${filter.field} = ${JSON.stringify(filter.value)}`
                      : t('All identified users')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('Identified users')}
                  </p>
                  <p className="text-3xl font-semibold tabular-nums">
                    {users.data.identifiedTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              {users.data.items.length === 0 ? (
                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                  {users.data.identifiedTotal === 0
                    ? t(
                        'No identified users yet. Send Identify with a stable id or userId and the fields you want to count.'
                      )
                    : t('No users match this filter.')}
                </div>
              ) : (
                <div className="w-0 min-w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('User ID')}</TableHead>
                        {filter && <TableHead>{filter.field}</TableHead>}
                        <TableHead>{t('Last identified')}</TableHead>
                        <TableHead>{t('Identify properties')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.data.items.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="max-w-64 break-all font-mono">
                            {user.userId}
                          </TableCell>
                          {filter && (
                            <TableCell className="max-w-64 break-all font-mono">
                              {JSON.stringify(filter.value)}
                            </TableCell>
                          )}
                          <TableCell className="whitespace-nowrap">
                            {new Date(user.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <details>
                              <summary className="cursor-pointer text-sm">
                                {t('View properties')}
                              </summary>
                              <pre className="bg-muted mt-2 max-w-xl whitespace-pre-wrap break-all rounded p-3 text-xs">
                                {JSON.stringify(user.properties, null, 2)}
                              </pre>
                            </details>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {users.data.total > users.data.totalPages * pageSize && (
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Showing the first {{num}} matching users. Counts include all matches.',
                    {
                      num: (users.data.totalPages * pageSize).toLocaleString(),
                    }
                  )}
                </p>
              )}
              <PaginationControls
                page={page}
                totalPages={users.data.totalPages}
                onPageChange={setPage}
                disabled={users.isFetching}
              />
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
