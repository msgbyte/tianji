import { useSocketSubscribe } from '@/api/socketio';
import { ServerStatusInfo } from '../../../types';

export function useServerMap(): Record<string, ServerStatusInfo> {
  const serverMap = useSocketSubscribe<Record<string, ServerStatusInfo>>(
    'onServerStatusUpdate',
    {}
  );

  return serverMap;
}
