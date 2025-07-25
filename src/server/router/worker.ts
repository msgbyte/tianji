import { Router } from 'express';
import { param, validate } from '../middleware/validate.js';
import { execWorker } from '../model/worker/index.js';
import { prisma } from '../model/_client.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

export const workerRouter = Router();

/**
 * Execute a worker by ID
 */
workerRouter.all(
  '/:workspaceId/:workerId',
  validate(param('workspaceId').isString(), param('workerId').isString()),
  async (req, res) => {
    if (!env.enableFunctionWorker) {
      return res.status(500).json({
        success: false,
        error: 'Function worker is not enabled',
      });
    }

    try {
      const { workspaceId, workerId } = req.params;
      const requestPayload = {
        ...req.query,
        ...req.body,
      };

      // Verify worker exists and belongs to workspace
      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          error: 'Worker not found or does not belong to this workspace',
        });
      }

      if (!worker.active) {
        return res.status(400).json({
          success: false,
          error: 'Worker is not active',
        });
      }

      // Execute the worker
      const execution = await execWorker(worker.code, workerId, requestPayload);

      const response = execution.responsePayload;

      if (typeof response === 'object') {
        res.json(response);
      } else {
        res.send(response);
      }
    } catch (error) {
      logger.error('Worker execution error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during worker execution',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
