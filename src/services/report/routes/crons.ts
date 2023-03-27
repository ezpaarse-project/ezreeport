import {
  forceCron,
  getAllCrons,
  getCron,
  startCron,
  stopCron
} from '~/lib/cron';
import { CustomRouter } from '~/lib/express-utils';
import { requireUser, requireAdmin } from '~/middlewares/auth';

const router = CustomRouter('crons')
  /**
   * Get all possible crons
   */
  .createRoute('GET /', async (_req, _res) => getAllCrons(), requireUser, requireAdmin)

  /**
   * Get info about specific cron
   */
  .createRoute('GET /:cron', async (req, _res) => {
    const { cron } = req.params;
    return getCron(cron);
  }, requireUser, requireAdmin)

  /**
   * Start specific cron
   */
  .createRoute('PUT /:cron/start', async (req, _res) => {
    const { cron } = req.params;
    return startCron(cron);
  }, requireUser, requireAdmin)

  /**
   * Stop specific cron
   */
  .createRoute('PUT /:cron/stop', async (req, _res) => {
    const { cron } = req.params;
    return stopCron(cron);
  }, requireUser, requireAdmin)

  /**
   * Force a specific cron to run
   */
  .createRoute('POST /:cron/force', async (req, _res) => {
    const { cron } = req.params;
    return forceCron(cron);
  }, requireUser, requireAdmin);

export default router;
