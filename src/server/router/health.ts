import { Router } from 'express';
import { version } from '../../shared';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  res.json({
    version,
  });
});
