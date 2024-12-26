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

export const useCommandPanel = create<CommandPanelState>((set) => ({
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
    useCommandPanel.setState({
      commands: {
        ...useCommandPanel.getState().commands,
        [key]: {
          key,
          label: options.label,
          handler: fn,
        },
      },
    });

    return () => {
      const commands = {
        ...useCommandPanel.getState().commands,
      };
      delete commands[key];

      useCommandPanel.setState({
        commands: {
          ...commands,
        },
      });
    };
  }, []);
}
