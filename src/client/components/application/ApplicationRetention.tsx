import { getUserTimezone } from '@/api/model/user';
import { trpc } from '@/api/trpc';
import {
  getRetentionDateRange,
  RetentionChart,
  RetentionDialog,
  type RetentionDialogProps,
} from '../Retention';

interface ApplicationRetentionProps
  extends Omit<RetentionDialogProps, 'children'> {
  workspaceId: string;
  applicationId: string;
  startAt: number;
  endAt: number;
}

export function ApplicationRetention(props: ApplicationRetentionProps) {
  return (
    <RetentionDialog {...props}>
      <ApplicationRetentionChart {...props} />
    </RetentionDialog>
  );
}

function ApplicationRetentionChart({
  workspaceId,
  applicationId,
  startAt,
  endAt,
}: ApplicationRetentionProps) {
  const { data, isLoading } = trpc.application.retention.useQuery({
    workspaceId,
    applicationId,
    ...getRetentionDateRange(startAt, endAt),
    timezone: getUserTimezone(),
  });

  return <RetentionChart data={data} isLoading={isLoading} />;
}
