import { useMemo } from 'react';
import { trpc } from '@/api/trpc';
import type { CodeEditorExtraLibrary } from '@/components/CodeEditor';
import { useCurrentWorkspaceId } from '@/store/user';

export function useWorkerSharedModuleTypes(workerId?: string) {
  const workspaceId = useCurrentWorkspaceId();
  const { data: moduleOptions = [] } =
    trpc.sharedModule.bindingOptions.useQuery({ workspaceId });
  const { data: currentBindings = [] } =
    trpc.worker.getModuleBindings.useQuery(
      { workspaceId, workerId: workerId ?? '' },
      { enabled: Boolean(workerId) }
    );

  const extraLibraries = useMemo<CodeEditorExtraLibrary[]>(() => {
    const activeModuleIds = new Set(moduleOptions.map((module) => module.id));
    const activeLibraries = moduleOptions.flatMap((module) => {
      const currentBinding = currentBindings.find(
        (binding) => binding.moduleId === module.id
      );
      const revision = currentBinding ?? module.revisions[0];
      if (!revision?.typeDeclaration) {
        return [];
      }

      return [
        {
          content: revision.typeDeclaration,
          filePath: `file:///tianji/shared-modules/${module.id}/${
            currentBinding?.moduleRevisionId ?? revision.id
          }.d.ts`,
        },
      ];
    });
    const archivedLibraries = currentBindings
      .filter((binding) => !activeModuleIds.has(binding.moduleId))
      .map((binding) => ({
        content: binding.typeDeclaration,
        filePath: `file:///tianji/shared-modules/${binding.moduleId}/${binding.moduleRevisionId}.d.ts`,
      }));

    return [...activeLibraries, ...archivedLibraries];
  }, [currentBindings, moduleOptions]);

  return { extraLibraries };
}
