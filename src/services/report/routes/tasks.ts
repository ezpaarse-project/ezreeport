import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { pick } from 'lodash';
import type { Prisma } from '~/.prisma/client';
import { addTaskToQueue } from '~/lib/bull';
import { CustomRouter } from '~/lib/express-utils';
import { b64ToString } from '~/lib/utils';
import { checkInstitution } from '~/middlewares/auth';
import { Roles } from '~/models/roles';
import {
  createTask,
  deleteTaskById,
  editTaskById,
  editTaskByIdWithHistory,
  getAllTasks,
  getTaskById
} from '~/models/tasks';
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
   * List all active tasks of authed user's institution.
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('GET /', Roles.READ, async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const tasks = await getAllTasks(
      {
        count: c,
        previous: p?.toString(),
        select: [
          'id',
          'name',
          'institution',
          'recurrence',
          'nextRun',
          'lastRun',
          'enabled',
          'createdAt',
          'updatedAt',
        ],
      },
      req.user?.institution,
    );

    return {
      data: tasks,
      meta: {
        // total: undefined,
        count: tasks.length,
        size: c,
        lastId: tasks.at(-1)?.id,
      },
    };
  }, checkInstitution)

  /**
   * Create a new task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('POST /', Roles.READ_WRITE, async (req, _res) => {
    if (!req.user || !req.user.institution) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    return {
      data: await createTask(
        req.body,
        req.user.username,
        req.user.institution,
      ),
      code: StatusCodes.CREATED,
    };
  }, checkInstitution)

  /**
   * Get spectific task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('GET /:task', Roles.READ, async (req, _res) => {
    const { task: id } = req.params;

    if (req.user && !req.user.institution && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    return task;
  }, checkInstitution)

  /**
   * Update a task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('PUT /:task', Roles.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await editTaskById(
      id,
      req.body,
      req.user.username,
      req.user.institution,
    );

    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user.institution}'`, StatusCodes.NOT_FOUND);
    }

    return task;
  }, checkInstitution)

  /**
   * Delete a task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('DELETE /:task', Roles.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await deleteTaskById(id, req.user.institution);

    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user.institution}'`, StatusCodes.NOT_FOUND);
    }

    return task;
  }, checkInstitution)

  /**
   * Shorthand to quickly enable a task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('PUT /:task/enable', Roles.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    if (task.enabled) {
      throw new HTTPError(`Task with id '${id}' is already enabled`, StatusCodes.CONFLICT);
    }

    const editedTask = await editTaskByIdWithHistory(
      id,
      {
        ...pick(task, 'name', 'targets', 'recurrence', 'nextRun'),
        nextRun: '',
        template: task.template as Prisma.InputJsonObject,
        enabled: true,
      },
      { type: 'edition', message: `Tâche activée par ${req.user?.username}` },
      req.user.institution,
    );

    return editedTask;
  }, checkInstitution)

  /**
   * Shorthand to quickly disable a task
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
   */
  .createSecuredRoute('PUT /:task/disable', Roles.READ_WRITE, async (req, _res) => {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    if (!task.enabled) {
      throw new HTTPError(`Task with id '${id}' is already disabled`, StatusCodes.CONFLICT);
    }

    const editedTask = await editTaskByIdWithHistory(
      id,
      {
        ...pick(task, 'name', 'targets', 'recurrence'),
        nextRun: '',
        template: task.template as Prisma.InputJsonObject,
        enabled: false,
      },
      { type: 'edition', message: `Tâche désactivée par ${req.user?.username}` },
      req.user.institution,
    );

    return editedTask;
  }, checkInstitution)

  /**
   * Force generation of report
   *
   * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)`
   * Parameter `test_emails` overrides task emails & enable first level of debug
   * Parameter `debug` is not accessible in PROD and enable second level of debug
   */
  .createSecuredRoute('POST /:task/run', Roles.READ_WRITE, async (req, _res) => {
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

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user.institution}'`, StatusCodes.NOT_FOUND);
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

    const job = await addTaskToQueue({
      task: { ...task, targets: testEmails || task.targets },
      customPeriod,
      origin: req.user.username,
      writeHistory: testEmails === undefined,
      debug: !!req.query.debug && process.env.NODE_ENV !== 'production',
    });

    return {
      id: job.id,
      queue: 'generation',
      data: job.data,
    };
  }, checkInstitution)

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

    const index = task.targets.findIndex((email) => email === data.email);
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
  }, checkInstitution);

export default router;
