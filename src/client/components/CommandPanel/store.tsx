import { useEvent } from '@/hooks/useEvent';
import { useEffect } from 'react';
import { create } from 'zustand';

export interface CommandType {
  key: string;
  label: ((input: string) => string) | string;
  handler: (input: string) => void;
}

interface CommandPanelState {
  commands: Record<string, CommandType>;
}

export const useCommandPanelStore = create<CommandPanelState>((set) => ({
  commands: {},
}));

export function useRegisterCommand(
  key: string,
  options: {
    label: CommandType['label'];
    handler: CommandType['handler'];
  }
) {
  const fn = useEvent(options.handler);

  useEffect(() => {
    useCommandPanelStore.setState({
      commands: {
        ...useCommandPanelStore.getState().commands,
        [key]: {
          key,
          label: options.label,
          handler: fn,
        },
      },
    });

    return () => {
      const commands = {
        ...useCommandPanelStore.getState().commands,
      };
      delete commands[key];

      useCommandPanelStore.setState({
        commands: {
          ...commands,
        },
      });
    };
  }, []);
}
