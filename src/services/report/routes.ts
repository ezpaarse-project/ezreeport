import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import { HTTPError } from './types/errors';
import openapi from './openapi.json';
import authRouter from './routes/auth';
import cronsRouter from './routes/crons';
import filesRouter from './routes/files';
import healthRouter from './routes/health';
import historyRouter from './routes/history';
import institutionsRouter from './routes/institutions';
import queuesRouter from './routes/queues';
import tasksRouter from './routes/tasks';
import templatesRouter from './routes/templates';
import unsubscribeRouter from './routes/unsubscribe';

const router = Router()
  /**
   * Router
   */
  .use('/me', authRouter)
  .use('/crons', cronsRouter)
  .use('/reports', filesRouter)
  .use('/health', healthRouter)
  .use('/history', historyRouter)
  .use('/institutions', institutionsRouter)
  .use('/queues', queuesRouter)
  .use('/tasks', tasksRouter)
  .use('/templates', templatesRouter)
  .use('/unsubscribe', unsubscribeRouter)

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
