import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getJob,
  getJobs,
  pauseQueue,
  queuesNames,
  resumeQueue,
  retryJob,
  type Queues
} from '../lib/bull';
import checkRight, { checkInstitution, Roles } from '../middlewares/auth';
import { HTTPError } from '../types/errors';

const router = Router();

/**
 * Check if given name is a valid queue name
 *
 * @param name Given name
 *
 * @returns Given name is a valid queue name
 */
const isQueue = (name: string): name is Queues => queuesNames.includes(name);

/**
 * Get all possible queues names (required for further requests)
 */
router.get('/', checkRight(Roles.READ), async (req, res) => {
  try {
    res.sendJson(queuesNames);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get info about specific queue
 */
router.get('/:queue', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    const { queue } = req.params;
    if (!isQueue(queue)) {
      throw new Error(`Queue "${queue}" not found`);
    }

    res.sendJson(await getJobs(queue));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Pause specific queue
 */
router.put('/:queue/pause', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    const { queue } = req.params;
    if (!isQueue(queue)) {
      throw new Error(`Queue "${queue}" not found`);
    }

    await pauseQueue(queue);

    res.sendJson(await getJobs(queue));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Resume specific queue
 */
router.put('/:queue/resume', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    const { queue } = req.params;
    if (!isQueue(queue)) {
      throw new Error(`Queue "${queue}" not found`);
    }

    await resumeQueue(queue);

    res.sendJson(await getJobs(queue));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get specific job info
 *
 * Can't access to other institution's jobs
 */
router.get('/:queue/:jobId', checkRight(Roles.READ), checkInstitution, async (req, res) => {
  try {
    const { queue, jobId } = req.params;
    if (!isQueue(queue)) {
      throw new Error(`Queue "${queue}" not found`);
    }

    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (req.user?.institution !== job.data.task.institution) {
      throw new HTTPError(`Job "${jobId}" doesn't match your institution "${req.user?.institution}"`, StatusCodes.FORBIDDEN);
    }

    res.sendJson(job);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Retry specific job
 *
 * Can't access to other institution's jobs
 *
 * Throw an error if job wasn't failed
 */
router.post('/:queue/:jobId/retry', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    const { queue, jobId } = req.params;
    if (!isQueue(queue)) {
      throw new Error(`Queue "${queue}" not found`);
    }

    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (req.user?.institution !== job.data.task.institution) {
      throw new HTTPError(`Job "${jobId}" doesn't match your institution "${req.user?.institution}"`, StatusCodes.FORBIDDEN);
    }

    const retriedJob = await retryJob(queue, jobId);
    res.sendJson(retriedJob);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
