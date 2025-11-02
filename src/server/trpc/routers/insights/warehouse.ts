import { z } from 'zod';
import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../../trpc.js';
import { prisma } from '../../../model/_client.js';
import { WarehouseDatebaseModelSchema } from '../../../prisma/zod/warehousedatebase.js';
import { WarehouseDatabaseTableModelSchema } from '../../../prisma/zod/warehousedatabasetable.js';
import {
  pingWarehouse,
  getWarehouseConnection,
  getWarehouseScopes,
  getFieldType,
} from '../../../model/insights/warehouse/utils.js';
import { upsertWarehouseTable } from '../../../model/insights/warehouse/connections.js';
import {
  createWarehouseAITools,
  warehouseAISystemPrompt,
} from '../../../model/insights/warehouse/ai.js';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { env } from '../../../utils/env.js';
import { logger } from '../../../utils/logger.js';

export const warehouseRouter = router({
  database: router({
    list: workspaceProcedure
      .output(
        z.array(
          z.object({
            id: z.string(),
            workspaceId: z.string(),
            name: z.string(),
            description: z.string(),
            dbDriver: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
          })
        )
      )
      .query(async ({ input }) => {
        const items = await prisma.warehouseDatabase.findMany({
          where: { workspaceId: input.workspaceId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            dbDriver: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return items;
      }),
    sync: workspaceAdminProcedure
      .input(
        z.object({
          id: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await prisma.warehouseDatabase.findUnique({
          where: { id: input.id },
          select: { id: true, connectionUri: true },
        });
        if (!db) {
          throw new Error('Warehouse database not found');
        }
        if (!db.connectionUri) {
          throw new Error('No connection uri configured');
        }
        const result = await upsertWarehouseTable(db.id, db.connectionUri);
        return result;
      }),
    upsert: workspaceAdminProcedure
      .input(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          description: z.string().optional().default(''),
          connectionUri: z.string().optional(),
          dbDriver: z.string().optional().default('mysql'),
        })
      )
      .output(WarehouseDatebaseModelSchema)
      .mutation(async ({ input }) => {
        // only ping when connectionUri provided (create or update connection string)
        if (typeof input.connectionUri === 'string') {
          const isHealthy = await pingWarehouse(input.connectionUri);
          if (!isHealthy) {
            throw new Error('Warehouse connection is not healthy');
          }
        }

        if (input.id) {
          const data: any = {
            name: input.name,
            description: input.description ?? '',
          };
          if (typeof input.connectionUri === 'string') {
            data.connectionUri = input.connectionUri;
          }
          if (typeof input.dbDriver === 'string') {
            data.dbDriver = input.dbDriver;
          }
          const res = await prisma.warehouseDatabase.update({
            where: { id: input.id },
            data,
          });

          if (typeof input.connectionUri === 'string') {
            await upsertWarehouseTable(input.id, input.connectionUri);
          }

          return res;
        } else {
          if (!input.connectionUri) {
            throw new Error('connectionUri is required when creating');
          }
          const res = await prisma.warehouseDatabase.create({
            data: {
              workspaceId: input.workspaceId,
              name: input.name,
              description: input.description ?? '',
              connectionUri: input.connectionUri,
              dbDriver: input.dbDriver ?? 'mysql',
            },
          });

          await upsertWarehouseTable(res.id, input.connectionUri);
          return res;
        }
      }),
    delete: workspaceAdminProcedure
      .input(z.object({ id: z.string() }))
      .output(WarehouseDatebaseModelSchema)
      .mutation(async ({ input }) => {
        const res = await prisma.warehouseDatabase.delete({
          where: { id: input.id },
        });
        return res;
      }),
  }),
  table: router({
    list: workspaceProcedure
      .output(z.array(WarehouseDatabaseTableModelSchema))
      .query(async ({ input }) => {
        const items = await prisma.warehouseDatabaseTable.findMany({
          where: { workspaceId: input.workspaceId },
          orderBy: { createdAt: 'desc' },
        });
        return items;
      }),
    upsert: workspaceAdminProcedure
      .input(
        z.object({
          id: z.string().optional(),
          databaseId: z.string(),
          name: z.string(),
          description: z.string().optional().default(''),
          ddl: z.string().optional().default(''),
          prompt: z.string().optional().default(''),
        })
      )
      .output(WarehouseDatabaseTableModelSchema)
      .mutation(async ({ input }) => {
        if (input.id) {
          const res = await prisma.warehouseDatabaseTable.update({
            where: { id: input.id },
            data: {
              name: input.name,
              description: input.description ?? '',
              ddl: input.ddl ?? '',
              prompt: input.prompt ?? '',
            },
          });
          return res;
        } else {
          const res = await prisma.warehouseDatabaseTable.create({
            data: {
              workspaceId: input.workspaceId,
              databaseId: input.databaseId,
              name: input.name,
              description: input.description ?? '',
              ddl: input.ddl ?? '',
              prompt: input.prompt ?? '',
            },
          });
          return res;
        }
      }),
    delete: workspaceAdminProcedure
      .input(z.object({ id: z.string() }))
      .output(WarehouseDatabaseTableModelSchema)
      .mutation(async ({ input }) => {
        const res = await prisma.warehouseDatabaseTable.delete({
          where: { id: input.id },
        });
        return res;
      }),
  }),
  query: router({
    execute: workspaceProcedure
      .input(
        z.object({
          databaseId: z.string(),
          sql: z.string(),
        })
      )
      .output(
        z.object({
          columns: z.array(
            z.object({
              name: z.string(),
              type: z.string(),
            })
          ),
          rows: z.array(z.any()),
          rowCount: z.number(),
          executionTime: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { databaseId, sql } = input;
        const startTime = Date.now();

        // Validate SQL - only allow SELECT statements
        const trimmedSql = sql.trim().toLowerCase();
        if (!trimmedSql.startsWith('select')) {
          throw new Error('Only SELECT queries are allowed');
        }

        // Check for dangerous keywords
        const dangerousKeywords = [
          'insert',
          'update',
          'delete',
          'drop',
          'truncate',
          'alter',
          'create',
          'replace',
        ];
        for (const keyword of dangerousKeywords) {
          if (trimmedSql.includes(keyword)) {
            throw new Error(`Dangerous keyword "${keyword}" is not allowed`);
          }
        }

        // Auto-add LIMIT if not present
        let finalSql = sql.trim();
        if (!trimmedSql.includes('limit')) {
          // Remove trailing semicolon if present
          if (finalSql.endsWith(';')) {
            finalSql = finalSql.slice(0, -1).trim();
          }
          finalSql = `${finalSql} LIMIT 1000`;
        }

        // Get database connection URI
        const database = await prisma.warehouseDatabase.findUnique({
          where: { id: databaseId },
          select: { connectionUri: true },
        });

        if (!database || !database.connectionUri) {
          throw new Error('Database connection not found');
        }

        // Execute query
        const connection = getWarehouseConnection(database.connectionUri);

        try {
          const [rows, fields] = await connection.query(finalSql);
          const executionTime = Date.now() - startTime;

          // Extract column information
          const columns = fields.map((field) => ({
            name: field.name,
            type: getFieldType(field.type ?? -1),
          }));

          const rowsArray = Array.isArray(rows) ? rows : [];

          return {
            columns,
            rows: rowsArray,
            rowCount: rowsArray.length,
            executionTime,
          };
        } catch (error) {
          logger.error('Query execution error:', error);
          throw new Error(
            `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }),
  }),
});
