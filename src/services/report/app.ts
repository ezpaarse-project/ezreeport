import express from 'express';
import routes from './routes';
import config from './lib/config';
import './lib/date-fns'; // Setup default options for date-fns
import { appLogger as logger } from './lib/logger';
import corsMiddleware from './middlewares/cors';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import { createTemplate, getTemplateByName, type FullTemplate } from './models/templates';

const { port, defaultTemplateName } = config;

/**
 * Add default template if not already present
 */
const initTemplates = async () => {
  logger.verbose(`[init] Checking existence of "${defaultTemplateName}"...`);
  let template: FullTemplate | null;
  try {
    template = await getTemplateByName(defaultTemplateName);
  } catch (error) {
    logger.error(`[init] Couldn't get template "${defaultTemplateName}":`, (error as Error).message);
    return;
  }

  if (template) {
    logger.verbose(`[init] Template "${defaultTemplateName}" found`);
    return;
  }

  logger.verbose(`[init] Template "${defaultTemplateName}" not found, creating it...`);
  try {
    await createTemplate(
      defaultTemplateName,
      { body: { layouts: [] } } satisfies Pick<FullTemplate, 'body'>,
    );
    logger.info(`[init] Template "${defaultTemplateName}" created`);
  } catch (error) {
    logger.error(`[init] Couldn't create template "${defaultTemplateName}":`, (error as Error).message);
  }
};

express()
  /**
   * General middlewares
   */
  .use(
    express.json(),
    corsMiddleware,
    loggerMiddleware,
    formatMiddleware,
  )

  /**
   * Router
   */
  .use('/', routes)

  /**
   * Start server
   */
  .listen(port, () => {
    logger.info(`[node] Service running in ${process.env.NODE_ENV} mode`);
    logger.info(`[http] Service listening on port ${port} in ${process.uptime().toFixed(2)}s`);

    // Add "raw" template if not already present
    initTemplates();
  });
