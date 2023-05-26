import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import { HTTPError } from '~/types/errors';
import openapi from './v1.openapi.json';

import v1 from './v1';

const router = Router()
  /**
   * Default version
   */
  .use('/', (_req, res, next) => { res.apiVersion = 1; next(); }, v1)

  /**
   * API Versions
   */
  .use('/v1', v1)

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
