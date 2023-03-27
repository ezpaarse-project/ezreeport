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
  .createRoute('GET /', async (req, _res) => {
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
  .createRoute('POST /', async (req, _res) => {
    const { username, ...data } = req.body;

    return {
      data: await createUser(username, data),
      code: StatusCodes.CREATED,
    };
  }, requireAPIKey)

  /**
   * Get specific user
   */
  .createRoute('GET /:username', async (req, _res) => {
    const { username } = req.params;

    const namespace = await getUserByUsername(username);
    if (!namespace) {
      throw new HTTPError(`Namespace with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Update a user
   */
  .createRoute('PUT /:username', async (req, _res) => {
    const { username } = req.params;

    const namespace = await editUserByUsername(username, req.body);
    if (!namespace) {
      throw new HTTPError(`Namespace with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Delete a user
   */
  .createRoute('DELETE /:username', async (req, _res) => {
    const { username } = req.params;

    const namespace = await deleteUserByUsername(username);
    if (!namespace) {
      throw new HTTPError(`Namespace with username '${username}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Add a user to a namespace
   */
  .createRoute('POST /:username/memberships', async (req, _res) => {
    const { username } = req.params;
    const { namespace, ...data } = req.body;

    await addUserToNamespace(username, namespace, data);

    return getUserByUsername(username);
  }, requireAPIKey)

  /**
   * Update a user of a namespace
   */
  .createRoute('PUT /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    await updateUserOfNamespace(username, namespace, req.body);

    return getUserByUsername(username);
  }, requireAPIKey)

  /**
   * Delete a user from a namespace
   */
  .createRoute('DELETE /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    await removeUserFromNamespace(username, namespace);

    return getUserByUsername(username);
  }, requireAPIKey);

export default router;
