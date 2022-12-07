import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getJob,
  getJobs,
  pauseQueue,
  queuesNames,
  resumeQueue,
  retryJob
} from '../lib/bull';
import { createSecuredRoute } from '../lib/express-utils';
import { checkInstitution } from '../middlewares/auth';
import { Roles } from '../models/roles';
import { HTTPError } from '../types/errors';

const router = Router();

Object.assign(router, { _permPrefix: 'queues' });

/**
 * Get all possible queues names (required for further requests)
 */
createSecuredRoute(router, 'GET /', Roles.READ, async (req, res) => {
  try {
    res.sendJson(queuesNames);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get info about specific queue
 */
createSecuredRoute(router, 'GET /:queue', Roles.SUPER_USER, async (req, res) => {
  try {
    const { queue } = req.params;
    res.sendJson(await getJobs(queue));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Pause specific queue
 */
createSecuredRoute(router, 'PUT /:queue/pause', Roles.SUPER_USER, async (req, res) => {
  try {
    const { queue } = req.params;
    await pauseQueue(queue);

    res.sendJson(await getJobs(queue));
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Resume specific queue
 */
createSecuredRoute(router, 'PUT /:queue/resume', Roles.SUPER_USER, async (req, res) => {
  try {
    const { queue } = req.params;
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
createSecuredRoute(router, 'GET /:queue/:jobId', Roles.READ, checkInstitution, async (req, res) => {
  try {
    const { queue, jobId } = req.params;
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
createSecuredRoute(router, 'POST /:queue/:jobId/retry', Roles.READ_WRITE, checkInstitution, async (req, res) => {
  try {
    const { queue, jobId } = req.params;
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
