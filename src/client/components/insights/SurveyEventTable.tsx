import { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SurveyEventTableProps {
  surveyId: string;
  data: Array<{
    id: string;
    name: string;
    createdAt: string;
    properties: Record<string, any>;
  }>;
}

export const SurveyEventTable: React.FC<SurveyEventTableProps> = ({
  surveyId,
  data,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: survey } = trpc.survey.get.useQuery(
    { workspaceId, surveyId },
    { enabled: Boolean(surveyId) }
  );

  const surveyFields = useMemo(() => {
    if (!survey?.payload) return [];
    const payload = survey.payload as {
      items: Array<{ label: string; name: string; type: string }>;
    };
    return payload.items || [];
  }, [survey]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">{t('Time')}</TableHead>
          {surveyFields.map((field) => (
            <TableHead key={field.name}>{field.label}</TableHead>
          ))}
          <TableHead className="w-[100px]">{t('Country')}</TableHead>
          <TableHead className="w-[100px]">{t('Browser')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((event) => {
          const eventDate = dayjs(event.createdAt);

          return (
            <TableRow key={event.id}>
              <TableCell className="text-muted-foreground text-xs">
                {eventDate.isValid()
                  ? eventDate.format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </TableCell>
              {surveyFields.map((field) => {
                const value = event.properties[field.name];
                return (
                  <TableCell key={field.name} className="max-w-[300px]">
                    <div className="truncate" title={String(value ?? '')}>
                      {value != null ? String(value) : '-'}
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="text-muted-foreground text-xs">
                {event.properties.country || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {event.properties.browser || '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
