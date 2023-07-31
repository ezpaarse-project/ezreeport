import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { pick } from 'lodash';
import type { Prisma } from '~/lib/prisma';
import { addTaskToGenQueue } from '~/lib/bull';
import { CustomRouter } from '~/lib/express-utils';
import { b64ToString } from '~/lib/utils';
import {
  createTask,
  deleteTaskById,
  editTaskById,
  editTaskByIdWithHistory,
  getAllTasks,
  getCountTask,
  getTaskById,
  isValidCreateTask,
  isValidTask,
} from '~/models/tasks';
import { Access } from '~/models/access';
import { ArgumentError, HTTPError, NotFoundError } from '~/types/errors';

type UnsubData = {
  unsubId: string,
  email: string
};

const unsubSchema = Joi.object<UnsubData>({
  unsubId: Joi.string().required(),
  email: Joi.string().email().required(),
});

/**
 * Check if input data is a unsubscribe data
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidUnsubData = (data: unknown): data is UnsubData => {
  const validation = unsubSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

const router = CustomRouter('tasks')
  /**
   * List all active tasks of authed user's namespace.
   */
  .createNamespacedRoute('GET /', Access.READ, async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const tasks = await getAllTasks(
      {
        count: c,
        previous: p?.toString(),
        select: [
          'id',
          'name',
          'namespaceId',
          'recurrence',
          'nextRun',
          'lastRun',
          'enabled',
          'createdAt',
          'updatedAt',
        ],
      },
      req.namespaceIds,
    );

    return {
      data: tasks,
      meta: {
        total: await getCountTask(req.namespaceIds),
        count: tasks.length,
        size: c,
        lastId: tasks.at(-1)?.id,
      },
    };
  })

  /**
   * Create a new task
   */
  .createNamespacedRoute('POST /', Access.READ_WRITE, async (req, _res) => {
    if (!req.namespaceIds?.includes(req.body.namespace)) {
      throw new HTTPError("The provided namespace doesn't exist or you don't have access to this namespace", StatusCodes.BAD_REQUEST);
    }

    // Validate body
    if (!isValidCreateTask(req.body)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    return {
      data: await createTask(
        req.body,
        req.user?.username ?? '',
      ),
      code: StatusCodes.CREATED,
    };
  })

  /**
   * Get specific task
   */
  .createNamespacedRoute('GET /:task', Access.READ, async (req, _res) => {
    const { task: id } = req.params;

    const task = await getTaskById(id, req.namespaceIds);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for namespace(s) '${req.namespaceIds}'`, StatusCodes.NOT_FOUND);
    }

    return task;
  })

  /**
   * Update or create a task
   */
  .createNamespacedRoute('PUT /:task', Access.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    let task = await getTaskById(id);
    if (task) {
      // Validate body
      if (!isValidTask(req.body)) {
        // As validation throws an error, this line shouldn't be called
        return {};
      }

      task = await editTaskById(
        id,
        req.body,
        req.user?.username ?? '',
        req.namespaceIds,
      );
    } else {
      // Validate body
      if (!isValidCreateTask(req.body)) {
        // As validation throws an error, this line shouldn't be called
        return {};
      }

      task = await createTask(req.body, req.user?.username ?? '', id);
    }

    return task;
  })

  /**
   * Delete a task
   */
  .createNamespacedRoute('DELETE /:task', Access.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    await deleteTaskById(id, req.namespaceIds);
  })

  /**
   * Shorthand to quickly enable a task
   */
  .createNamespacedRoute('PUT /:task/enable', Access.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    const task = await getTaskById(id, req.namespaceIds);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for namespace '${req.namespaceIds}'`, StatusCodes.NOT_FOUND);
    }

    if (task.enabled) {
      throw new HTTPError(`Task with id '${id}' is already enabled`, StatusCodes.CONFLICT);
    }

    const editedTask = await editTaskByIdWithHistory(
      id,
      {
        ...pick(task, 'name', 'targets', 'recurrence', 'nextRun'),
        nextRun: task.nextRun,
        template: task.template as Prisma.InputJsonObject,
        enabled: true,
      },
      { type: 'edition', message: `Tâche activée par ${req.user?.username}` },
      req.namespaceIds,
    );

    return editedTask;
  })

  /**
   * Shorthand to quickly disable a task
   */
  .createNamespacedRoute('PUT /:task/disable', Access.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    const task = await getTaskById(id, req.namespaceIds);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for namespaces '${req.namespaceIds}'`, StatusCodes.NOT_FOUND);
    }

    if (!task.enabled) {
      throw new HTTPError(`Task with id '${id}' is already disabled`, StatusCodes.CONFLICT);
    }

    const editedTask = await editTaskByIdWithHistory(
      id,
      {
        ...pick(task, 'name', 'targets', 'recurrence'),
        nextRun: task.nextRun,
        template: task.template as Prisma.InputJsonObject,
        enabled: false,
      },
      { type: 'edition', message: `Tâche désactivée par ${req.user?.username}` },
      req.namespaceIds,
    );

    return editedTask;
  })

  /**
   * Force generation of report
   *
   * Parameter `test_emails` overrides task emails & enable first level of debug
   * Parameter `debug` is not accessible in PROD and enable second level of debug
   */
  .createNamespacedRoute('POST /:task/run', Access.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;
    let { test_emails: testEmails } = req.query;
    const {
      period_start: periodStart,
      period_end: periodEnd,
    } = req.query;

    // Transform emails into array if needed
    // TODO[refactor]
    if (testEmails != null) {
      if (!Array.isArray(testEmails)) testEmails = [testEmails.toString()];
      else testEmails = testEmails.map((email) => email.toString());
    }

    const task = await getTaskById(id, req.namespaceIds);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for namespace '${req.namespaceIds}'`, StatusCodes.NOT_FOUND);
    }

    let customPeriod: { start: string, end: string } | undefined;
    if (periodStart && periodEnd) {
      if (Array.isArray(periodStart) || Array.isArray(periodEnd)) {
        throw new HTTPError("Custom period can't be an array", StatusCodes.BAD_REQUEST);
      }

      customPeriod = {
        start: periodStart.toString(),
        end: periodEnd.toString(),
      };
    } else if ((periodStart && !periodEnd) || (!periodStart && periodEnd)) {
      throw new HTTPError('Missing part of custom period', StatusCodes.BAD_REQUEST);
    }

    const { namespace, ...taskData } = task;
    const job = await addTaskToGenQueue({
      task: {
        ...taskData,
        namespaceId: namespace.id,
        targets: testEmails || task.targets,
      },
      customPeriod,
      origin: req.user?.username ?? '',
      writeHistory: testEmails === undefined,
      debug: !!req.query.debug && process.env.NODE_ENV !== 'production',
    });

    return {
      id: job.id,
      queue: 'generation',
      data: job.data,
    };
  })

  /**
   * Shorthand to remove given email in given task
   */
  .createRoute('PUT /:task/unsubscribe', async (req, _res) => {
    const { task: id } = req.params;
    const data = req.body;

    if (!isValidUnsubData(data)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    const [taskId64, to64] = decodeURIComponent(data.unsubId).split(':');
    if (id !== b64ToString(taskId64) || data.email !== b64ToString(to64)) {
      throw new ArgumentError('Integrity check failed');
    }

    const task = await getTaskById(id);
    if (!task) {
      throw new NotFoundError(`Task ${id} not found`);
    }

    const index = task.targets.findIndex((email: string) => email === data.email);
    if (index < 0) {
      throw new ArgumentError(`Email "${data.email}" not found in targets of task "${task.id}"`);
    }
    task.targets.splice(index, 1);

    await editTaskByIdWithHistory(
      task.id,
      { ...task, template: task.template as Prisma.JsonObject },
      { type: 'unsubscription', message: `${data.email} s'est désinscrit de la liste de diffusion.` },
    );

    return getTaskById(task.id);
  });

export default router;
