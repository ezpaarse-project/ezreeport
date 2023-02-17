import { StatusCodes } from 'http-status-codes';
import {
  getJob,
  getJobs,
  pauseQueue,
  getQueues,
  getCountJobs,
  resumeQueue,
  retryJob
} from '~/lib/bull';
import { CustomRouter } from '~/lib/express-utils';
import { checkInstitution } from '~/middlewares/auth';
import { Roles } from '~/models/roles';
import { HTTPError } from '~/types/errors';

const router = CustomRouter('queues')
  /**
   * Get all possible queues
   */
  .createSecuredRoute('GET /', Roles.READ, (_req, _res) => getQueues())

  /**
   * Pause specific queue
   */
  .createSecuredRoute('PUT /:queue/pause', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    await pauseQueue(queue);

    return (await getQueues()).find(({ name }) => name === queue);
  })

  /**
   * Resume specific queue
   */
  .createSecuredRoute('PUT /:queue/resume', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    await resumeQueue(queue);

    return (await getQueues()).find(({ name }) => name === queue);
  })

/**
   * Get jobs of a specific queue
   */
  .createSecuredRoute('GET /:queue/jobs', Roles.SUPER_USER, async (req, _res) => {
    const { queue } = req.params;
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    // TODO: custom sort
    const jobs = await getJobs(queue, { count: c, previous: p?.toString() });

    return {
      data: jobs,
      meta: {
        total: await getCountJobs(queue),
        count: jobs.length,
        size: c,
        lastId: jobs.at(-1)?.id,
      },
    };
  })

  /**
   * Get specific job info
   *
   * Can't access to other institution's jobs
   */
  .createSecuredRoute('GET /:queue/jobs/:jobId', Roles.READ, async (req, _res) => {
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
  .createSecuredRoute('POST /:queue/jobs/:jobId/retry', Roles.READ_WRITE, async (req, _res) => {
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
