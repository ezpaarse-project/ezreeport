import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapi from './v1.openapi.json';

import adminRouter from './v1/admin';
import authRouter from './v1/auth';
import cronsRouter from './v1/crons';
import filesRouter from './v1/files';
import healthRouter from './v1/health';
import queuesRouter from './v1/queues';
import tasksRouter from './v1/tasks';
import tasksActivityRouter from './v1/tasksActivity';
import templatesRouter from './v1/templates';
import unsubscribeRouter from './v1/unsubscribe';

const router = Router()
  /**
   * Management routes
   */
  .use('/admin', adminRouter)

  /**
   * Admin routes
   */
  .use('/crons', cronsRouter)
  .use('/queues', queuesRouter)
  .use('/templates', templatesRouter)

  /**
   * Authenticated routes
   */
  .use('/me', authRouter)
  .use('/reports', filesRouter)
  .use('/tasks', tasksRouter)
  .use('/tasks-activity', tasksActivityRouter)

  /**
   * Other routes
  */
  .use('/unsubscribe', unsubscribeRouter)
  .use('/health', healthRouter)

  /**
   * API Docs
   */
  .use('/doc/openapi.json', (_req, res) => res.json(openapi))
  .use('/doc', swaggerUi.serve, swaggerUi.setup(openapi));

export default router;
