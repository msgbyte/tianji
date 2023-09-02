import 'dotenv/config';
import express from 'express';
import ViteExpress from 'vite-express';
import compression from 'compression';
import { userRouter } from './router/user';

const app = express();

app.use(compression());
app.use(express.json());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use('/api/user', userRouter);

app.use((err: any, req: any, res: any, next: any) => {
  res.status(500);
  res.json({ error: err.message });
});

ViteExpress.listen(app, 3000, () => {
  console.log('Server is listening on port 3000...');
  console.log('Website: http://localhost:3000');
});
