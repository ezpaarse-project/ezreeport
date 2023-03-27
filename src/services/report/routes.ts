import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';
import { HTTPError } from './types/errors';

import authRouter from './routes/auth';
import cronsRouter from './routes/crons';
import filesRouter from './routes/files';
import healthRouter from './routes/health';
import historyRouter from './routes/history';
import namespacesRouter from './routes/namespaces';
import queuesRouter from './routes/queues';
import tasksRouter from './routes/tasks';
import templatesRouter from './routes/templates';
import unsubscribeRouter from './routes/unsubscribe';
import usersRouter from './routes/users';

const router = Router()
  /**
   * Management routes
   */
  .use('/namespaces', namespacesRouter)
  .use('/users', usersRouter)

  /**
   * Admin routes
   */
  .use('/crons', cronsRouter)
  .use('/queues', queuesRouter)

  /**
   * Authed routes
   */
  .use('/me', authRouter)
  .use('/reports', filesRouter)
  .use('/history', historyRouter)
  .use('/tasks', tasksRouter)
  .use('/templates', templatesRouter)

  /**
   * Other routes
  */
  .use('/unsubscribe', unsubscribeRouter)
  .use('/health', healthRouter)

  /**
   * API Docs
   */
  .use('/doc/openapi.json', (_req, res) => res.json(openapi))
  .use('/doc', swaggerUi.serve, swaggerUi.setup(openapi))

  /**
   * 404 Fallback
   */
  .use('*', (_req, res) => {
    res.errorJson(new HTTPError('Route not found', StatusCodes.NOT_FOUND));
  });

export default router;
