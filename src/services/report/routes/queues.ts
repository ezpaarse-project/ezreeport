import { StatusCodes } from 'http-status-codes';
import { Task } from '~/.prisma/client';
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
import { requireUser, requireAdmin } from '~/middlewares/auth';
import { Access } from '~/models/access';
import { HTTPError } from '~/types/errors';

const router = CustomRouter('queues')
  /**
   * Get all possible queues
   */
  .createRoute('GET /', (_req, _res) => getQueues(), requireUser, requireAdmin)

  /**
   * Pause specific queue
   */
  .createRoute('PUT /:queue/pause', async (req, _res) => {
    const { queue } = req.params;
    await pauseQueue(queue);

    return (await getQueues()).find(({ name }) => name === queue);
  }, requireUser, requireAdmin)

  /**
   * Resume specific queue
   */
  .createRoute('PUT /:queue/resume', async (req, _res) => {
    const { queue } = req.params;
    await resumeQueue(queue);

    return (await getQueues()).find(({ name }) => name === queue);
  }, requireUser, requireAdmin)

  /**
   * Get jobs of a specific queue
   */
  .createRoute('GET /:queue/jobs', async (req, _res) => {
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
  }, requireUser, requireAdmin)

  /**
   * Get specific job info
   *
   * Can't access to other namespace's jobs
   */
  .createSecuredRoute('GET /:queue/jobs/:jobId', Access.READ, async (req, _res) => {
    const { queue, jobId } = req.params;
    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (
      !req.namespaceIds?.length
      || !req.namespaceIds.includes((job.data.task as Task).namespaceId)
    ) {
      throw new HTTPError(`Job "${jobId}" doesn't match your namespace "${req.namespaceIds}"`, StatusCodes.FORBIDDEN);
    }

    return job;
  })

  /**
   * Retry specific job
   *
   * Can't access to other namespace's jobs
   *
   * Throw an error if job wasn't failed
   */
  .createSecuredRoute('POST /:queue/jobs/:jobId/retry', Access.READ_WRITE, async (req, _res) => {
    const { queue, jobId } = req.params;
    const job = await getJob(queue, jobId);
    if (!job) {
      throw new HTTPError(`Job "${jobId}" not found`, StatusCodes.NOT_FOUND);
    }

    if (
      !req.namespaceIds?.length
      || !req.namespaceIds.includes((job.data.task as Task).namespaceId)
    ) {
      throw new HTTPError(`Job "${jobId}" doesn't match your namespace "${req.namespaceIds}"`, StatusCodes.FORBIDDEN);
    }

    return retryJob(queue, jobId);
  });

export default router;
