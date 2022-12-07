import { Router } from 'express';
import {
  forceCron,
  getAllCrons,
  getCron,
  startCron,
  stopCron
} from '../lib/cron';
import { createSecuredRoute } from '../lib/express-utils';
import { Roles } from '../models/roles';

const router = Router();

Object.assign(router, { _permPrefix: 'crons' });

/**
 * Get all possible crons
 */
createSecuredRoute(router, 'GET /', Roles.SUPER_USER, async (req, res) => {
  try {
    res.sendJson(await getAllCrons());
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get info about specific cron
 */
createSecuredRoute(router, 'GET /:cron', Roles.SUPER_USER, async (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(await getCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Start specific cron
 */
createSecuredRoute(router, 'PUT /:cron/start', Roles.SUPER_USER, async (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(await startCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Stop specific cron
 */
createSecuredRoute(router, 'PUT /:cron/stop', Roles.SUPER_USER, async (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(await stopCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Force a specific cron to run
 */
createSecuredRoute(router, 'POST /:cron/force', Roles.SUPER_USER, async (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(await forceCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
