import type { WorkerEnvironmentVariableFormValue } from './WorkerEnvironmentVariablesField';

type WorkerTestCodeInput = {
  workspaceId: string;
  code: string;
  payload?: Record<string, unknown>;
  environmentVariables?: WorkerEnvironmentVariableFormValue[];
};

export function buildWorkerTestCodeInput(
  { workerId }: { workerId?: string },
  input: WorkerTestCodeInput
) {
  return {
    ...input,
    workerId,
  };
}
