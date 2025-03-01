import { AppRouterOutput, trpc } from '@/api/trpc';
import { useGlobalConfig } from '@/hooks/useConfig';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { compact } from 'lodash-es';
import { useMemo, useState } from 'react';

type SurveyResultItem =
  AppRouterOutput['survey']['resultList']['items'][number];

const columnHelper = createColumnHelper<SurveyResultItem>();

export function useSurveyListColumns(surveyId: string) {
  const workspaceId = useCurrentWorkspaceId();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const config = useGlobalConfig();
  const { t } = useTranslation();

  const { data: info } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });

  const columns = useMemo(() => {
    return compact([
      columnHelper.accessor('id', {
        header: 'ID',
        size: 230,
        cell: (props) => {
          return (
            <div
              className="cursor-pointer hover:underline hover:decoration-dotted"
              onClick={() => {
                setSelectedIndex(props.row.index);
              }}
            >
              {props.getValue()}
            </div>
          );
        },
      }),
      ...(info?.payload.items.map((item) =>
        columnHelper.accessor(`payload.${item.name}`, {
          header: item.label,
        })
      ) ?? []),
      config.enableAI &&
        columnHelper.accessor('aiCategory', {
          header: t('AI Category'),
          size: 200,
        }),
      config.enableAI &&
        columnHelper.accessor('aiTranslation', {
          header: t('AI Translation'),
          size: 200,
        }),
      columnHelper.accessor('createdAt', {
        header: t('Created At'),
        size: 200,
        cell: (props) => dayjs(props.getValue()).format('YYYY-MM-DD HH:mm:ss'),
      }),
    ]);
  }, [t, info]);

  return { selectedIndex, setSelectedIndex, columns };
}
