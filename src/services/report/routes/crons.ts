import {
  forceCron,
  getAllCrons,
  getCron,
  startCron,
  stopCron
} from '~/lib/cron';
import { CustomRouter } from '~/lib/express-utils';
import { requireAPIKey } from '~/middlewares/auth';

const router = CustomRouter('crons')
  /**
   * Get all possible crons
   */
  .createRoute('GET /', async (_req, _res) => getAllCrons(), requireAPIKey)

  /**
   * Get info about specific cron
   */
  .createRoute('GET /:cron', async (req, _res) => {
    const { cron } = req.params;
    return getCron(cron);
  }, requireAPIKey)

  /**
   * Start specific cron
   */
  .createRoute('PUT /:cron/start', async (req, _res) => {
    const { cron } = req.params;
    return startCron(cron);
  }, requireAPIKey)

  /**
   * Stop specific cron
   */
  .createRoute('PUT /:cron/stop', async (req, _res) => {
    const { cron } = req.params;
    return stopCron(cron);
  }, requireAPIKey)

  /**
   * Force a specific cron to run
   */
  .createRoute('POST /:cron/force', async (req, _res) => {
    const { cron } = req.params;
    return forceCron(cron);
  }, requireAPIKey);

export default router;
