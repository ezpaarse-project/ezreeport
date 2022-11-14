import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';
import checkRight, { checkInstitution, Roles } from '../middlewares/auth';
import { generateReport } from '../models/reports';
import {
  createTask,
  deleteTaskById,
  editTaskById,
  getAllTasks,
  getTaskById
} from '../models/tasks';
import { HTTPError } from '../types/errors';

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
      req.body,
      id,
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
      {
        ...pick(task, 'name', 'layout', 'targets', 'recurrence', 'nextRun'),
        enabled: true,
      },
      id,
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
      {
        ...pick(task, 'name', 'layout', 'targets', 'recurrence', 'nextRun'),
        enabled: false,
      },
      id,
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

    // TODO[feat]: Put in job queue to allow parallel process, returns if started or not
    const reportResult = await generateReport(
      { ...task, targets: testEmails || task.targets },
      req.user.username,
      testEmails === undefined,
      !!req.query.debug && process.env.NODE_ENV !== 'production',
    );

    // TODO[feat]: put in queue for email

    res.sendJson(reportResult, reportResult.success ? 201 : 500);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
