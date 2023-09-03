import { message } from 'antd';
import { useState } from 'react';
import { useEvent } from './useEvent';

export function useRequest<T, P>(queryFn: (...args: P[]) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const run = useEvent(async (...args: P[]) => {
    try {
      setLoading(true);
      const res = await queryFn(...args);
      setData(res);
    } catch (err: any) {
      message.error(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  });

  return [
    {
      loading,
      data,
    },
    run,
  ] as const;
}
