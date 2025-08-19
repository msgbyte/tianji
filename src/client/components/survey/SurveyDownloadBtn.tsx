import React, { useState } from 'react';
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCloudDownload } from 'react-icons/lu';
import dayjs from 'dayjs';
import { AppRouterOutput, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { useEvent } from '@/hooks/useEvent';
import { clamp, omit } from 'lodash-es';
import { Progress } from '../ui/progress';
import jsonExport from 'jsonexport/dist';
import { downloadCSV } from '@/utils/dom';
import { message } from 'antd';
import { DatePicker, DatePickerRange } from '../DatePicker';

interface SurveyDownloadBtnProps {
  surveyId: string;
}
export const SurveyDownloadBtn: React.FC<SurveyDownloadBtnProps> = React.memo(
  (props) => {
    const { surveyId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const [date, setDate] = useState<DatePickerRange | undefined>({
      from: dayjs().subtract(1, 'months').toDate(),
      to: dayjs().toDate(),
    });
    const { t } = useTranslation();

    const { data: info } = trpc.survey.get.useQuery({
      workspaceId,
      surveyId,
    });
    const { data: count = 1 } = trpc.survey.count.useQuery({
      workspaceId,
      surveyId,
    });
    const [downloadProgress, setDownloadProgress] = useState<number | null>(
      null
    );

    const trpcUtils = trpc.useUtils();

    const handleStart = useEvent(async () => {
      try {
        const limit = 1000;
        let cursor: string | undefined = undefined;
        const downloadResultList: AppRouterOutput['survey']['resultList']['items'][number][] =
          [];
        setDownloadProgress(0);
        const startAt = date?.from
          ? dayjs(date.from).startOf('day').valueOf()
          : undefined;
        const endAt = date?.to
          ? dayjs(date.to).endOf('day').valueOf()
          : undefined;

        while (true) {
          const { items, nextCursor } = await trpcUtils.survey.resultList.fetch(
            {
              workspaceId,
              surveyId,
              limit: 1000,
              cursor,
              startAt,
              endAt,
            }
          );

          downloadResultList.push(...items);
          setDownloadProgress(clamp(downloadResultList.length / count, 0, 1));

          cursor = nextCursor;
          if (items.length < limit) {
            // no more
            break;
          }
        }

        // download with csv file
        const fields = info?.payload.items ?? [];
        const csv = await jsonExport(
          downloadResultList.map((item) => {
            const map = fields.reduce(
              (prev, curr) => ({
                ...prev,
                [curr.label]: item.payload[curr.name],
              }),
              {} as Record<string, string>
            );

            return {
              id: item.id,
              sessionId: item.sessionId,
              ...map,
              ...omit(item, ['id', 'sessionId', 'payload']),
            };
          })
        );
        let filename = info?.name ?? surveyId;
        if (date && startAt && endAt) {
          filename += `-${dayjs(startAt).format('YYYY-MM-DD')}-${dayjs(endAt).format('YYYY-MM-DD')}`;
        }
        downloadCSV(csv, filename);
      } catch (err) {
        message.error(String(err));
      } finally {
        setDownloadProgress(null);
      }
    });

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button Icon={LuCloudDownload}>{t('Download')}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Download')}</DialogTitle>
            <DialogDescription>
              {t('Download survey data with csv for further use.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DatePicker value={date} onChange={setDate} />
          </div>
          <DialogFooter className="sm:items-center sm:justify-between">
            <div className="w-full sm:w-[120px]">
              {typeof downloadProgress === 'number' && (
                <Progress
                  value={downloadProgress * 100}
                  title={`${Number((downloadProgress * 100).toFixed(2))}%`}
                />
              )}
            </div>
            <Button
              loading={typeof downloadProgress === 'number'}
              onClick={handleStart}
            >
              {t('Start')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
SurveyDownloadBtn.displayName = 'SurveyDownloadBtn';
