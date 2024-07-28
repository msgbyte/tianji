import { router, workspaceOwnerProcedure } from '../trpc.js';
import { clearOfflineServerStatus } from '../../model/serverStatus.js';

export const serverStatusRouter = router({
  clearOfflineServerStatus: workspaceOwnerProcedure.mutation(
    async ({ input }) => {
      const workspaceId = input.workspaceId;

      return clearOfflineServerStatus(workspaceId);
    }
  ),
});
