import { Router } from 'express';
import {
  getAllCrons, getCron, startCron, stopCron
} from '../lib/cron';
import checkRight, { Roles } from '../middlewares/auth';

const router = Router();

/**
 * Get all possible crons
 */
router.get('/', checkRight(Roles.SUPER_USER), (req, res) => {
  try {
    res.sendJson(getAllCrons());
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get info about specific cron
 */
router.get('/:cron', checkRight(Roles.SUPER_USER), (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(getCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Start specific cron
 */
router.put('/:cron/start', checkRight(Roles.SUPER_USER), (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(startCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Stop specific cron
 */
router.put('/:cron/stop', checkRight(Roles.SUPER_USER), (req, res) => {
  try {
    const { cron } = req.params;
    res.sendJson(stopCron(cron));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
