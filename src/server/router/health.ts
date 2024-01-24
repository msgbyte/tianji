import { Router } from 'express';
import { version } from '@tianji/shared';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  res.json({
    version,
  });
});
