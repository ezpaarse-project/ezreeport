import { Router, type Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import checkRight, { Roles } from '../middlewares/auth';
import { findInstitutionByCreatorOrRole } from '../models/institutions';
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
 * Get institution of authed user, or given in query param (if user is Roles.SUPER_USER)
 *
 * @param req Express request
 *
 * @returns The id of institution
 */
const getAuthedInstitution = async (req: Request): Promise<string | undefined> => {
  if (req.user) {
    if (req.user.roles.includes(Roles.SUPER_USER) && (typeof req.query.institution === 'string' || typeof req.query.institution === 'undefined')) {
      return req.query.institution;
    }
    const { _id: id } = await findInstitutionByCreatorOrRole(req.user.username, req.user.roles);
    return id.toString();
  }
  return undefined;
};

/**
 * List all active tasks of authed user's institution.
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.get('/', checkRight(Roles.READ), async (req, res) => {
  try {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const institution = await getAuthedInstitution(req);
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
          'enabled',
          'createdAt',
          'updatedAt',
        ],
      },
      institution,
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
router.post('/', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const institution = await getAuthedInstitution(req);
    if (!institution) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    res.sendJson(
      await createTask(
        req.body,
        req.user?.username ?? 'UNKNOWN_USER',
        institution,
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
router.get('/:task', checkRight(Roles.READ), async (req, res) => {
  try {
    const { task: id } = req.params;

    const institution = await getAuthedInstitution(req);
    if (!institution && req.user && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${institution}'`, StatusCodes.NOT_FOUND);
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
router.put('/:task', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { task: id } = req.params;

    const institution = await getAuthedInstitution(req);
    if (!institution && req.user && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await editTaskById(
      req.body,
      id,
      req.user?.username ?? 'UNKNOWN_USER',
      institution,
    );

    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${institution}'`, StatusCodes.NOT_FOUND);
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
router.delete('/:task', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { task: id } = req.params;

    const institution = await getAuthedInstitution(req);
    if (!institution && req.user && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await deleteTaskById(id, institution);

    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${institution}'`, StatusCodes.NOT_FOUND);
    }

    res.sendJson(task, StatusCodes.OK);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Force generation of report
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)`
 */
router.post('/:task/run', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { task: id } = req.params;
    let { test_emails: testEmails } = req.query;

    // Transform emails into array if needed
    if (testEmails != null) {
      if (!Array.isArray(testEmails)) testEmails = [testEmails.toString()];
      else testEmails = testEmails.map((email) => email.toString());
    }

    const institution = await getAuthedInstitution(req);
    if (!institution && req.user && !req.user.roles.includes(Roles.SUPER_USER)) {
      throw new HTTPError("Can't find your institution.", StatusCodes.BAD_REQUEST);
    }

    const task = await getTaskById(id, institution);
    if (!task) {
      throw new HTTPError(`Task with id '${id}' not found for institution '${institution}'`, StatusCodes.NOT_FOUND);
    }

    // TODO[feat]: Put in job queue to allow parallel process, returns if started or not
    const reportResult = await generateReport(
      { ...task, targets: testEmails || task.targets },
      req.user?.username ?? 'UNKNOWN_USER',
      testEmails === undefined,
    );

    // TODO[feat]: put in queue for email

    res.sendJson(reportResult, reportResult.success ? 201 : 500);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
