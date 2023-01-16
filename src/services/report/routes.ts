import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
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
import { HTTPError } from './types/errors';

const router = Router()
  /**
   * Router
   */
  .use('/templates', templatesRouter)
  .use('/tasks', tasksRouter)
  .use('/history', historyRouter)
  .use('/institutions', institutionsRouter)
  .use('/reports', filesRouter)
  .use('/queues', queuesRouter)
  .use('/crons', cronsRouter)
  .use('/unsubscribe', unsubscribeRouter)
  .use('/health', healthRouter)
  .use('/me', authRouter)

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
