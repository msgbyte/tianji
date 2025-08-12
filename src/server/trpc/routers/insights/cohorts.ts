import { z } from 'zod';
import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../../trpc.js';
import { prisma } from '../../../model/_client.js';
import { WarehouseCohortsModelSchema } from '../../../prisma/zod/warehousecohorts.js';
import { getAllCohorts } from '../../../model/insights/warehouse/cohorts.js';

export const insightCohortsRouter = router({
  list: workspaceProcedure
    .output(z.array(WarehouseCohortsModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const items = await getAllCohorts(workspaceId);
      return items as unknown as z.infer<typeof WarehouseCohortsModelSchema>[];
    }),
  upsert: workspaceAdminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        warehouseApplicationId: z.string(),
        filter: z.array(z.any()),
      })
    )
    .output(WarehouseCohortsModelSchema)
    .mutation(async ({ input }) => {
      if (input.id) {
        const res = await prisma.warehouseCohorts.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            filter: input.filter,
          },
        });
        return res as unknown as z.infer<typeof WarehouseCohortsModelSchema>;
      } else {
        const res = await prisma.warehouseCohorts.create({
          data: {
            name: input.name,
            workspaceId: input.workspaceId,
            filter: input.filter,
            warehouseApplicationId: input.warehouseApplicationId,
          },
        });
        return res as unknown as z.infer<typeof WarehouseCohortsModelSchema>;
      }
    }),
  delete: workspaceAdminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .output(WarehouseCohortsModelSchema)
    .mutation(async ({ input }) => {
      const res = await prisma.warehouseCohorts.delete({
        where: { id: input.id },
      });

      return res as unknown as z.infer<typeof WarehouseCohortsModelSchema>;
    }),
});
