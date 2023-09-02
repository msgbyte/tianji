import { Router } from 'express';
import { body, validate } from '../middleware/validate';
import { createAdminUser } from '../model/user';

export const userRouter = Router();

userRouter.post(
  '/createAdmin',
  validate(
    body('username').exists().withMessage('Username should be existed'),
    body('password').exists().withMessage('Password should be existed')
  ),
  async (req, res) => {
    const { username, password } = req.body;

    await createAdminUser(username, password);

    res.json({ result: true });
  }
);
