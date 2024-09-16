import React, { useMemo, useState } from 'react';
import { trpc } from '../../../api/trpc';
import { useAllowEdit } from './useAllowEdit';
import {
  MonitorStatusPageEditForm,
  MonitorStatusPageEditFormValues,
} from './EditForm';
import clsx from 'clsx';
import { useRequest } from '../../../hooks/useRequest';
import { ColorSchemeSwitcher } from '../../ColorSchemeSwitcher';
import { StatusPageServices } from './Services';
import { useTranslation } from '@i18next-toolkit/react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MarkdownViewer } from '@/components/MarkdownEditor';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/utils/style';

interface MonitorStatusPageProps {
  slug: string;
  showBackBtn?: boolean;
  fullWidth?: boolean;
}

export const MonitorStatusPage: React.FC<MonitorStatusPageProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { slug, showBackBtn = true, fullWidth } = props;

    const { data: info } = trpc.monitor.getPageInfo.useQuery({
      slug,
    });
    const editPageMutation = trpc.monitor.editPage.useMutation();
    const trpcUtils = trpc.useUtils();
    const navigate = useNavigate();

    const allowEdit = useAllowEdit(info?.workspaceId);
    const [editMode, setEditMode] = useState(() => {
      return new URLSearchParams(window.location.search).has('edit');
    });

    const monitorList = info?.monitorList ?? [];

    const initialValues = useMemo(() => {
      if (!info) {
        return {};
      }

      return {
        ...info,
        domain: info.domain ?? '',
      };
    }, [info]);

    const [{ loading }, handleSave] = useRequest(
      async (values: MonitorStatusPageEditFormValues) => {
        if (!info) {
          return;
        }

        const newPageInfo = await editPageMutation.mutateAsync({
          id: info.id,
          workspaceId: info.workspaceId,
          ...values,
        });

        trpcUtils.monitor.getPageInfo.setData(
          {
            slug,
          },
          newPageInfo
        );
        setEditMode(false);

        if (info.slug !== newPageInfo.slug) {
          // if slug is changed, should to navigate to new url
          navigate({
            to: '/status/$slug',
            params: {
              slug: newPageInfo.slug,
            },
            replace: true,
          });
        }
      }
    );

    const editBtn = (
      <Sheet open={editMode} onOpenChange={setEditMode}>
        <SheetTrigger>
          <Button>{t('Edit')}</Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-auto">
          <SheetHeader>{t('Modify Status Page Info')}</SheetHeader>

          <Separator className="my-4" />

          <MonitorStatusPageEditForm
            isLoading={loading}
            initialValues={initialValues}
            onFinish={handleSave}
            onCancel={() => setEditMode(false)}
          />
        </SheetContent>
      </Sheet>
    );

    return (
      <div className="flex h-full w-full">
        <Helmet>
          <title>
            {info?.title}
            {info?.description && ` | ${info?.description}`}
          </title>
        </Helmet>

        <div
          className={cn(
            'mx-auto overflow-auto px-4 py-8',
            fullWidth ? 'w-full' : 'w-full md:w-4/5 xl:w-3/5'
          )}
        >
          <div className="flex">
            <div className="mb-4 flex-1 text-2xl font-bold">{info?.title}</div>

            <ColorSchemeSwitcher />
          </div>

          {allowEdit && (
            <div className="mb-4 flex gap-2">
              {editBtn}

              {showBackBtn && !editMode && (
                <Link to="/">
                  <Button variant="outline">{t('Back to Admin')}</Button>
                </Link>
              )}
            </div>
          )}

          {/* Desc */}
          <div className="mb-4">
            <MarkdownViewer value={info?.description ?? ''} />
          </div>

          <div className="mb-2 text-lg font-semibold">{t('Services')}</div>

          {info && (
            <StatusPageServices
              workspaceId={info.workspaceId}
              monitorList={monitorList}
            />
          )}
        </div>
      </div>
    );
  }
);
MonitorStatusPage.displayName = 'MonitorStatusPage';
