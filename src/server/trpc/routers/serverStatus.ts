import { router, workspaceAdminProcedure } from '../trpc.js';
import { clearOfflineServerStatus } from '../../model/serverStatus.js';

export const serverStatusRouter = router({
  clearOfflineServerStatus: workspaceAdminProcedure.mutation(
    async ({ input }) => {
      const workspaceId = input.workspaceId;

      return clearOfflineServerStatus(workspaceId);
    }
  ),
});
