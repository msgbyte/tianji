import { Router } from 'express';
import { body, validate } from '../middleware/validate';
import { authUser, createAdminUser } from '../model/user';
import { auth, jwtSign } from '../middleware/auth';

export const userRouter = Router();

userRouter.post(
  '/login',
  validate(
    body('username').exists().withMessage('Username should be existed'),
    body('password').exists().withMessage('Password should be existed')
  ),
  async (req, res) => {
    const { username, password } = req.body;

    const user = await authUser(username, password);

    const token = jwtSign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({ token });
  }
);

userRouter.post(
  '/createAdmin',
  auth(),
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
