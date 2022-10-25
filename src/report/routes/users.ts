import { Router, type Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import checkRight, { Roles } from '../middlewares/auth';
import {
  createUser,
  deleteUserByUsername,
  getAllUsers,
  getUserByUsername,
  // eslint-disable-next-line @typescript-eslint/comma-dangle
  updateUserByUsername
} from '../models/users';
import { HTTPError } from '../types/errors';

const router = Router();

/**
 * Check if authed user tries to access unauthorized route
 *
 * @param req The express request
 * @param username The username given
 */
const checkAuthedUser = (req: Request, username: string) => {
  if (
    !req.user
    || (req.user.username !== username && !req.user.roles.includes(Roles.SUPER_USER))
  ) {
    throw new HTTPError(`User '${req.user?.username}' doesn't have the rights to access to '${req.method} ${req.originalUrl}'`, StatusCodes.FORBIDDEN);
  }
};

/**
 * Get all users
 *
 * Only accessible to Roles.SUPER_USER
 */
router.get('/', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const users = await getAllUsers({ count: c, previous: p?.toString() });

    res.sendJson(
      users,
      StatusCodes.OK,
      {
        // total: undefined,
        count: users.length,
        lastId: users[users.length - 1]?.username,
      },
    );
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Create new user
 *
 * Only accessible to Roles.SUPER_USER
 */
router.post('/', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    res.sendJson(
      await createUser(req.body),
      StatusCodes.CREATED,
    );
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get specific user
 *
 * Only accessible to Roles.SUPER_USER if not the authed user
 */
router.get('/:username', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { username } = req.params;
    checkAuthedUser(req, username);

    const user = await getUserByUsername(username);
    if (user === null) {
      throw new HTTPError(`User '${username}' not found`, 404);
    }

    res.sendJson(user);
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Delete specific user
 *
 * Only accessible to Roles.SUPER_USER if not the authed user
 */
router.delete('/:username', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { username } = req.params;
    checkAuthedUser(req, username);

    res.sendJson(
      await deleteUserByUsername(username),
    );
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Edit specific user
 *
 * Only accessible to Roles.SUPER_USER if not the authed user
 */
router.put('/:username', checkRight(Roles.READ), async (req, res) => {
  try {
    const { username } = req.params;
    checkAuthedUser(req, username);

    res.sendJson(
      await updateUserByUsername(username, req.body),
    );
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
