import { router, workspaceOwnerProcedure } from '../trpc';
import { clearOfflineServerStatus } from '../../model/serverStatus';

export const serverStatusRouter = router({
  clearOfflineServerStatus: workspaceOwnerProcedure.mutation(
    async ({ input }) => {
      const workspaceId = input.workspaceId;

      return clearOfflineServerStatus(workspaceId);
    }
  ),
});
