import { StatusCodes } from 'http-status-codes';
import {
  getJob,
  getJobs,
  pauseQueue,
  queuesNames,
  resumeQueue,
  retryJob
} from '../lib/bull';
import { CustomRouter } from '../lib/express-utils';
import { checkInstitution } from '../middlewares/auth';
import { Roles } from '../models/roles';
import { HTTPError } from '../types/errors';

const router = CustomRouter('queues')
  /**
   * Get all possible queues names (required for further requests)
   */
  .createSecuredRoute('GET /', Roles.READ, async (_req, _res) => queuesNames)

  /**
   * Get info about specific queue
   */
  .createSecuredRoute('GET /:queue', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    return getJobs(queue);
  })

  /**
   * Pause specific queue
   */
  .createSecuredRoute('PUT /:queue/pause', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    await pauseQueue(queue);

    return getJobs(queue);
  })

  /**
   * Resume specific queue
   */
  .createSecuredRoute('PUT /:queue/resume', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    await resumeQueue(queue);

    return getJobs(queue);
  })

  /**
   * Get specific job info
   *
   * Can't access to other institution's jobs
   */
  .createSecuredRoute('GET /:queue/:jobId', Roles.READ, async (req, _res) => {
    const { queue, jobId } = req.params;
    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (
      !req.user
      || (
        req.user.institution !== job.data.task.institution
        && !req.user.roles.includes(Roles.SUPER_USER)
      )
    ) {
      throw new HTTPError(`Job "${jobId}" doesn't match your institution "${req.user?.institution}"`, StatusCodes.FORBIDDEN);
    }

    return job;
  }, checkInstitution)

  /**
   * Retry specific job
   *
   * Can't access to other institution's jobs
   *
   * Throw an error if job wasn't failed
   */
  .createSecuredRoute('POST /:queue/:jobId/retry', Roles.READ_WRITE, async (req, _res) => {
    const { queue, jobId } = req.params;
    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (
      !req.user
      || (
        req.user.institution !== job.data.task.institution
        && !req.user.roles.includes(Roles.SUPER_USER)
      )
    ) {
      throw new HTTPError(`Job "${jobId}" doesn't match your institution "${req.user?.institution}"`, StatusCodes.FORBIDDEN);
    }

    return retryJob(queue, jobId);
  }, checkInstitution);

export default router;
