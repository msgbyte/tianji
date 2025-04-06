import { Badge } from '@/components/ui/badge';

interface AIGatewayStatusProps {
  status: string;
}

export function AIGatewayStatus({ status }: AIGatewayStatusProps) {
  const colorMap: Record<string, string> = {
    Pending: 'bg-amber-400 hover:bg-amber-500',
    Success: 'bg-green-400 hover:bg-green-500',
    Failed: 'bg-red-500 hover:bg-red-600',
  };

  return (
    <Badge className={colorMap[status] || 'bg-gray-500 hover:bg-gray-600'}>
      {status}
    </Badge>
  );
}
