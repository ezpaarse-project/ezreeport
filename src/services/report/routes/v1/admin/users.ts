import { StatusCodes } from 'http-status-codes';
import { CustomRouter } from '~/lib/express-utils';
import { requireAPIKey } from '~/middlewares/auth';
import { addUserToNamespace, removeUserFromNamespace, updateUserOfNamespace } from '~/models/memberships';
import {
  createUser,
  deleteUserByUsername,
  getAllUsers,
  editUserByUsername,
  getCountUsers,
  getUserByUsername
} from '~/models/users';
import { HTTPError } from '~/types/errors';

const router = CustomRouter('users')
  /**
   * List all user
   */
  .createBasicRoute('GET /', async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const entries = await getAllUsers(
      {
        count: c,
        previous: p?.toString(),
      },
    );

    return {
      data: entries,
      code: StatusCodes.OK,
      meta: {
        total: await getCountUsers(),
        count: entries.length,
        size: c,
        lastId: entries.at(-1)?.username,
      },
    };
  }, requireAPIKey)

  /**
   * Create a new user
   */
  .createBasicRoute('POST /', async (req, _res) => {
    const { username, ...data } = req.body;

    return {
      data: await createUser(username, data),
      code: StatusCodes.CREATED,
    };
  }, requireAPIKey)

  /**
   * Get specific user
   */
  .createBasicRoute('GET /:username', async (req, _res) => {
    const { username } = req.params;

    const user = await getUserByUsername(username);
    if (!user) {
      throw new HTTPError(`User with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return user;
  }, requireAPIKey)

  /**
   * Update a user
   */
  .createBasicRoute('PUT /:username', async (req, _res) => {
    const { username } = req.params;

    const user = await editUserByUsername(username, req.body);
    if (!user) {
      throw new HTTPError(`User with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return user;
  }, requireAPIKey)

  /**
   * Delete a user
   */
  .createBasicRoute('DELETE /:username', async (req, _res) => {
    const { username } = req.params;

    const user = await deleteUserByUsername(username);
    if (!user) {
      throw new HTTPError(`User with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return user;
  }, requireAPIKey)

  /**
   * Add a user to a namespace
   */
  .createBasicRoute('POST /:username/memberships', async (req, _res) => {
    const { username } = req.params;
    const { user, ...data } = req.body;

    await addUserToNamespace(username, user, data);

    return getUserByUsername(username);
  }, requireAPIKey)

  /**
   * Update a user of a namespace
   */
  .createBasicRoute('PUT /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    await updateUserOfNamespace(username, namespace, req.body);

    return getUserByUsername(username);
  }, requireAPIKey)

  /**
   * Delete a user from a namespace
   */
  .createBasicRoute('DELETE /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    await removeUserFromNamespace(username, namespace);

    return getUserByUsername(username);
  }, requireAPIKey);

export default router;
