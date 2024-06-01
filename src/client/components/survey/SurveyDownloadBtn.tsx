import React, { useRef, useState } from 'react';
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
import { LuCalendar, LuDownloadCloud } from 'react-icons/lu';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { AppRouterOutput, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { useEvent } from '@/hooks/useEvent';
import { clamp, pick } from 'lodash-es';
import { Progress } from '../ui/progress';
import jsonExport from 'jsonexport/dist';
import { downloadCSV } from '@/utils/dom';
import { message } from 'antd';

interface SurveyDownloadBtnProps {
  surveyId: string;
}
export const SurveyDownloadBtn: React.FC<SurveyDownloadBtnProps> = React.memo(
  (props) => {
    const { surveyId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const [date, setDate] = useState<DateRange | undefined>({
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
              ...pick(item, [
                'language',
                'browser',
                'os',
                'country',
                'subdivision1',
                'subdivision2',
                'city',
                'createdAt',
              ]),
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
          <Button Icon={LuDownloadCloud}>{t('Download')}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Download')}</DialogTitle>
            <DialogDescription>
              {t('Download survey data with csv for further use.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <LuCalendar className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {dayjs(date.from).format('MMM DD, YYYY')} -{' '}
                        {dayjs(date.to).format('MMM DD, YYYY')}
                      </>
                    ) : (
                      dayjs(date.from).format('MMM DD, YYYY')
                    )
                  ) : (
                    <span>{t('Pick a date')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter className="sm:items-center sm:justify-between">
            <div className="w-full sm:w-[120px]">
              {typeof downloadProgress === 'number' && (
                <Progress value={downloadProgress} />
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
