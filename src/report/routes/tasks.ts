import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { pick } from 'lodash';
import { addTaskToQueue } from '../lib/bull';
import { b64ToString } from '../lib/utils';
import checkRight, { checkInstitution, Roles } from '../middlewares/auth';
import {
  createTask,
  deleteTaskById,
  editTaskById,
  editTaskByIdWithHistory,
  getAllTasks,
  getTaskById
} from '../models/tasks';
import { ArgumentError, HTTPError, NotFoundError } from '../types/errors';

const router = Router();

/**
 * List all active tasks of authed user's institution.
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.get('/', checkRight(Roles.READ), checkInstitution, async (req, res) => {
  try {
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

    res.sendJson(
      tasks,
      StatusCodes.OK,
      {
        // total: undefined,
        count: tasks.length,
        lastId: tasks.at(-1)?.id,
      },
    );
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Create a new task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.post('/', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    if (!req.user || !req.user.institution) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    res.sendJson(
      await createTask(
        req.body,
        req.user.username,
        req.user.institution,
      ),
      StatusCodes.CREATED,
    );
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get spectific task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.get('/:task', checkRight(Roles.READ), checkInstitution, async (req, res) => {
  try {
    const { task: id } = req.params;

    if (req.user && !req.user.institution && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    res.sendJson(task, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Update a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.put('/:task', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
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

    res.sendJson(task, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Delete a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.delete('/:task', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await deleteTaskById(id, req.user.institution);

    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user.institution}'`, StatusCodes.NOT_FOUND);
    }

    res.sendJson(task, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Shorthand to quickly enable a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.put('/:task/enable', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    const editedTask = await editTaskById(
      id,
      // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
      {
        ...pick(task, 'name', 'layout', 'targets', 'recurrence', 'nextRun'),
        enabled: true,
      },
      req.user.username,
      req.user.institution,
    );

    res.sendJson(editedTask, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Shorthand to quickly disable a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.put('/:task/disable', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    const { task: id } = req.params;

    if (!req.user || (!req.user.institution && !req.user.roles.includes(Roles.SUPER_USER))) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, req.user?.institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${req.user?.institution}'`, StatusCodes.NOT_FOUND);
    }

    const editedTask = await editTaskById(
      id,
      // TODO[refactor]: Re-do types InputTask & Task to avoid getting Date instead of string in some cases. Remember that Prisma.TaskCreateInput exists. https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety
      {
        ...pick(task, 'name', 'layout', 'targets', 'recurrence', 'nextRun'),
        enabled: false,
      },
      req.user.username,
      req.user.institution,
    );

    res.sendJson(editedTask, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Force generation of report
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)`
 * Parameter `test_emails` overrides task emails & enable first level of debug
 * Parameter `debug` is not accessible in PROD and enable second level of debug
 */
router.post('/:task/run', checkRight(Roles.READ_WRITE), checkInstitution, async (req, res) => {
  try {
    const { task: id } = req.params;
    let { test_emails: testEmails } = req.query;

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

    const job = await addTaskToQueue({
      task: { ...task, targets: testEmails || task.targets },
      origin: req.user.username,
      writeHistory: testEmails === undefined,
      debug: !!req.query.debug && process.env.NODE_ENV !== 'production',
    });

    res.sendJson({
      id: job.id,
      data: job.data,
    }, 200);
  } catch (error) {
    res.errorJson(error);
  }
});

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

/**
 * Shorthand to remove given email in given task
 */
router.put('/:task/unsubscribe', async (req, res) => {
  try {
    const { task: id } = req.params;
    const data = req.body;

    if (!isValidUnsubData(data)) {
      // As validation throws an error, this line shouldn't be called
      return;
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
      { ...task, layout: task.layout as Prisma.JsonObject },
      { type: 'unsubscription', message: `${data.email} s'est désinscrit de la liste de diffusion.` },
    );

    res.sendJson(await getTaskById(task.id));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
