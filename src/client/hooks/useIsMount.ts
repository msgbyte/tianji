import { useEffect, useState } from 'react';

export function useIsMount(): boolean {
  const [isMount, setIsMount] = useState(false);

  useEffect(() => {
    setIsMount(true);
  }, []);

  return isMount;
}
