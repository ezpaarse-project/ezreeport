import {
  forceCron,
  getAllCrons,
  getCron,
  startCron,
  stopCron
} from '~/lib/cron';
import { CustomRouter } from '~/lib/express-utils';

const router = CustomRouter('crons')
  /**
   * Get all possible crons
   */
  .createAdminRoute('GET /', async (_req, _res) => getAllCrons())

  /**
   * Get info about specific cron
   */
  .createAdminRoute('GET /:cron', async (req, _res) => {
    const { cron } = req.params;
    return getCron(cron);
  })

  /**
   * Start specific cron
   */
  .createAdminRoute('PUT /:cron/start', async (req, _res) => {
    const { cron } = req.params;
    return startCron(cron);
  })

  /**
   * Stop specific cron
   */
  .createAdminRoute('PUT /:cron/stop', async (req, _res) => {
    const { cron } = req.params;
    return stopCron(cron);
  })

  /**
   * Force a specific cron to run
   */
  .createAdminRoute('POST /:cron/force', async (req, _res) => {
    const { cron } = req.params;
    return forceCron(cron);
  });

export default router;
