import { Router } from 'express';
import { body, validate } from '../middleware/validate';
import {
  authUser,
  authUserWithToken,
  createAdminUser,
  createUser,
  getUserCount,
} from '../model/user';
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

    const token = jwtSign(user);

    res.json({ info: user, token });
  }
);

userRouter.post(
  '/register',
  validate(
    body('username').exists().withMessage('Username should be existed'),
    body('password').exists().withMessage('Password should be existed')
  ),
  async (req, res) => {
    const { username, password } = req.body;

    const userCount = await getUserCount();
    if (userCount === 0) {
      const user = await createAdminUser(username, password);

      const token = jwtSign(user);

      res.json({ info: user, token });
    } else {
      const user = await createUser(username, password);

      const token = jwtSign(user);

      res.json({ info: user, token });
    }
  }
);

userRouter.post(
  '/loginWithToken',
  validate(body('token').exists().withMessage('Token should be existed')),
  async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw new Error('Cannot get token');
    }

    try {
      const user = await authUserWithToken(token);

      const newToken = jwtSign(user);

      res.json({ info: user, token: newToken });
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
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
