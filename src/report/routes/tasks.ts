import { Router, type Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import checkRight, { Roles } from '../middlewares/auth';
import { findInstitutionByCreatorOrRole } from '../models/institutions';
import { createTask, getAllTasks, getTaskById } from '../models/tasks';
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
    const tasks = await getAllTasks({ count: c, previous: p?.toString() }, institution);

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
    if (task) {
      res.sendJson(task, StatusCodes.OK);
    } else {
      throw new HTTPError(`Task with id '${id}' not found for institution '${institution}'`, StatusCodes.NOT_FOUND);
    }
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Update a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 * `req.body.owner` is only required if Roles.SUPER_USER
 */
router.put('/:task', checkRight(Roles.READ_WRITE), async (req, res) => { });

/**
 * Delete a task
 *
 * Parameter `institution` is only accessible to Roles.SUPER_USER (ignored otherwise)
 */
router.delete('/:task', checkRight(Roles.READ_WRITE), async (req, res) => { });

export default router;
