import 'dotenv/config';
import './init';
import express from 'express';
import 'express-async-errors';
import ViteExpress from 'vite-express';
import compression from 'compression';
import passport from 'passport';
import morgan from 'morgan';
import { userRouter } from './router/user';
import { websiteRouter } from './router/website';
import { workspaceRouter } from './router/workspace';
import { telemetryRouter } from './router/telemetry';

const port = Number(process.env.PORT || 12345);

const app = express();

app.use(compression());
app.use(express.json());
app.use(passport.initialize());
app.use(morgan('tiny'));

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use('/api/user', userRouter);
app.use('/api/website', websiteRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/telemetry', telemetryRouter);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

ViteExpress.listen(app, port, () => {
  console.log(`Server is listening on port ${port}...`);
  console.log(`Website: http://127.0.0.1:${port}`);
});
