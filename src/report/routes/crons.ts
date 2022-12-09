import {
  forceCron,
  getAllCrons,
  getCron,
  startCron,
  stopCron
} from '../lib/cron';
import { CustomRouter } from '../lib/express-utils';
import { Roles } from '../models/roles';

const router = CustomRouter('crons')
  /**
   * Get all possible crons
   */
  .createSecuredRoute('GET /', Roles.SUPER_USER, async (_req, _res) => getAllCrons())

  /**
   * Get info about specific cron
   */
  .createSecuredRoute('GET /:cron', Roles.SUPER_USER, async (req, _res) => {
    const { cron } = req.params;
    return getCron(cron);
  })

  /**
   * Start specific cron
   */
  .createSecuredRoute('PUT /:cron/start', Roles.SUPER_USER, async (req, _res) => {
    const { cron } = req.params;
    return startCron(cron);
  })

  /**
   * Stop specific cron
   */
  .createSecuredRoute('PUT /:cron/stop', Roles.SUPER_USER, async (req, _res) => {
    const { cron } = req.params;
    return stopCron(cron);
  })

  /**
   * Force a specific cron to run
   */
  .createSecuredRoute('POST /:cron/force', Roles.SUPER_USER, async (req, _res) => {
    const { cron } = req.params;
    return forceCron(cron);
  });

export default router;
