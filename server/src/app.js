import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import boardRoutes from './routes/board.routes.js';
import taskRoutes from './routes/task.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Allow the Vite dev client (and a configurable production origin) to call us.
  const origins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: true }));

  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'pulseboard-api', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
