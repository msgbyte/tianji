import { useEffect } from 'react';
import { AIStoreContextType, useAIStore } from './store';

export function useAIStoreContext(context: AIStoreContextType) {
  useEffect(() => {
    useAIStore.setState({
      context,
    });

    return () => {
      useAIStore.setState({
        context: {
          type: 'unknown',
        },
      });
    };
  }, []);
}
