import { getUserTimezone } from '@/api/model/user';
import { trpc } from '@/api/trpc';
import {
  getRetentionDateRange,
  RetentionChart,
  RetentionDialog,
  type RetentionDialogProps,
} from '../Retention';

interface WebsiteRetentionProps extends Omit<RetentionDialogProps, 'children'> {
  workspaceId: string;
  websiteId: string;
  startAt: number;
  endAt: number;
}

export function WebsiteRetention(props: WebsiteRetentionProps) {
  return (
    <RetentionDialog {...props}>
      <WebsiteRetentionChart {...props} />
    </RetentionDialog>
  );
}

function WebsiteRetentionChart({
  workspaceId,
  websiteId,
  startAt,
  endAt,
}: WebsiteRetentionProps) {
  const { data, isLoading } = trpc.website.retention.useQuery({
    workspaceId,
    websiteId,
    ...getRetentionDateRange(startAt, endAt),
    timezone: getUserTimezone(),
  });

  return <RetentionChart data={data} isLoading={isLoading} />;
}
