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
  .createSecuredRoute('GET /', Roles.SUPER_USER, async (req, res) => {
    try {
      res.sendJson(await getAllCrons());
    } catch (error) {
      res.errorJson(error);
    }
  })

  /**
   * Get info about specific cron
   */
  .createSecuredRoute('GET /:cron', Roles.SUPER_USER, async (req, res) => {
    try {
      const { cron } = req.params;
      res.sendJson(await getCron(cron));
    } catch (error) {
      res.errorJson(error);
    }
  })

  /**
   * Start specific cron
   */
  .createSecuredRoute('PUT /:cron/start', Roles.SUPER_USER, async (req, res) => {
    try {
      const { cron } = req.params;
      res.sendJson(await startCron(cron));
    } catch (error) {
      res.errorJson(error);
    }
  })

  /**
   * Stop specific cron
   */
  .createSecuredRoute('PUT /:cron/stop', Roles.SUPER_USER, async (req, res) => {
    try {
      const { cron } = req.params;
      res.sendJson(await stopCron(cron));
    } catch (error) {
      res.errorJson(error);
    }
  })

  /**
   * Force a specific cron to run
   */
  .createSecuredRoute('POST /:cron/force', Roles.SUPER_USER, async (req, res) => {
    try {
      const { cron } = req.params;
      res.sendJson(await forceCron(cron));
    } catch (error) {
      res.errorJson(error);
    }
  });

export default router;
