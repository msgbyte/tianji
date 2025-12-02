import { prisma } from '../../_client.js';
import { getWarehouseTables, type WarehouseDriver } from './utils.js';

/**
 * Upsert warehouse table records by database id and connection uri.
 */
export async function upsertWarehouseTable(
  databaseId: string,
  connectionUri: string
): Promise<{ created: number; updated: number; deleted: number }> {
  return await prisma.$transaction(async (tx) => {
    const database = await tx.warehouseDatabase.findUnique({
      where: { id: databaseId },
      select: { id: true, workspaceId: true, dbDriver: true },
    });
    if (!database) {
      throw new Error('Warehouse database not found');
    }

    const driver = (database.dbDriver || 'mysql') as WarehouseDriver;

    const [liveTables, existing] = await Promise.all([
      getWarehouseTables(connectionUri, driver),
      tx.warehouseDatabaseTable.findMany({
        where: { workspaceId: database.workspaceId, databaseId: database.id },
        select: { id: true, name: true },
      }),
    ]);
    const nameToRecord = new Map(existing.map((r) => [r.name, r]));

    let created = 0;
    let updated = 0;
    let deleted = 0;

    for (const table of liveTables) {
      const record = nameToRecord.get(table.tableName);
      if (record) {
        await tx.warehouseDatabaseTable.update({
          where: { id: record.id },
          data: { ddl: table.ddl },
        });
        updated += 1;
      } else {
        await tx.warehouseDatabaseTable.create({
          data: {
            workspaceId: database.workspaceId,
            databaseId: database.id,
            name: table.tableName,
            ddl: table.ddl,
          },
        });
        created += 1;
      }
    }

    // Delete records that no longer exist in liveTables for this database
    const liveNames = new Set(liveTables.map((t) => t.tableName));
    const toDeleteIds = existing
      .filter((r) => !liveNames.has(r.name))
      .map((r) => r.id);

    if (toDeleteIds.length > 0) {
      const { count } = await tx.warehouseDatabaseTable.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
      deleted = count;
    }

    return { created, updated, deleted };
  });
}
