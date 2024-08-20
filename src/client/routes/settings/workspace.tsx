import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentWorkspace } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from 'antd';
import { AppRouterOutput, trpc } from '@/api/trpc';
import { createColumnHelper, DataTable } from '@/components/DataTable';
import { useMemo } from 'react';
import { get } from 'lodash-es';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/settings/workspace')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

type MemberInfo = AppRouterOutput['workspace']['members'][number];
const columnHelper = createColumnHelper<MemberInfo>();

function PageComponent() {
  const { t } = useTranslation();
  const { id, name } = useCurrentWorkspace();
  const { data: members = [] } = trpc.workspace.members.useQuery({
    workspaceId: id,
  });

  const columns = useMemo(() => {
    return [
      columnHelper.accessor(
        (data) =>
          get(data, ['user', 'nickname']) || get(data, ['user', 'username']),
        {
          header: t('Name'),
          size: 300,
        }
      ),
      columnHelper.accessor('user.email', {
        header: t('Email'),
        size: 130,
        cell: (props) => {
          return (
            <span>
              {props.getValue()}
              {props.row.original.user.emailVerified && (
                <Badge className="ml-1">{t('Verified')}</Badge>
              )}
            </span>
          );
        },
      }),
      columnHelper.accessor('role', {
        header: t('Role'),
        size: 130,
      }),
    ];
  }, [t]);

  return (
    <CommonWrapper header={<CommonHeader title={t('Workspace')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="text-lg font-bold">
              {t('Current Workspace:')} {name}
            </CardHeader>
            <CardContent>
              <div>
                <span className="mr-2">{t('Workspace ID')}:</span>
                <span>
                  <Typography.Text code={true} copyable={true}>
                    {id}
                  </Typography.Text>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-lg font-bold">
              {t('Members')}
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={members} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
