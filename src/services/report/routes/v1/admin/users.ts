import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
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
import { ArgumentError, HTTPError, NotFoundError } from '~/types/errors';

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
   *
   * @deprecated Use `PUT /:username` instead
   */
  .createBasicRoute('POST /', async (req, _res) => {
    const { username, ...data } = req.body;

    const validation = Joi.string().validate(username);
    if (validation.error) {
      throw new ArgumentError(`username is not valid: ${validation.error?.message}`);
    }

    return {
      code: StatusCodes.CREATED,
      data: await createUser(username, data),
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
   * Update or create a user
   */
  .createBasicRoute('PUT /:username', async (req, _res) => {
    const { username } = req.params;

    let user = await getUserByUsername(username);
    let code;
    if (user) {
      user = await editUserByUsername(username, req.body);
      code = StatusCodes.OK;
    } else {
      user = await createUser(username, req.body);
      code = StatusCodes.CREATED;
    }

    return {
      code,
      data: user,
    };
  }, requireAPIKey)

  /**
   * Delete a user
   */
  .createBasicRoute('DELETE /:username', async (req, _res) => {
    const { username } = req.params;

    await deleteUserByUsername(username);
  }, requireAPIKey)

  /**
   * Add a user to a namespace
   *
   * @deprecated Use `PUT /:username/memberships/:namespace` instead
   */
  .createBasicRoute('POST /:username/memberships', async (req, _res) => {
    const { username } = req.params;
    const { user, ...data } = req.body;

    const userExists = !!await getUserByUsername(username);
    if (!userExists) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    await addUserToNamespace(username, user, data);

    return getUserByUsername(username);
  }, requireAPIKey)

  /**
   * Get a membership of a user
   */
  .createBasicRoute('GET /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    const membership = user.memberships.find(({ namespace: { id } }) => id === namespace);
    if (!membership) {
      throw new NotFoundError(`User "${username}" is not in namespace "${namespace}"`);
    }

    return membership;
  }, requireAPIKey)

  /**
   * Update or add a user of a namespace
   */
  .createBasicRoute('PUT /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    let code;
    if (user.memberships.find(({ namespace: { id } }) => id === namespace)) {
      await updateUserOfNamespace(username, namespace, req.body);
      code = StatusCodes.OK;
    } else {
      await addUserToNamespace(username, namespace, req.body);
      code = StatusCodes.CREATED;
    }

    return {
      code,
      data: (await getUserByUsername(username))?.memberships
        .find(({ namespace: { id } }) => id === namespace),
    };
  }, requireAPIKey)

  /**
   * Removes a user from a namespace
   */
  .createBasicRoute('DELETE /:username/memberships/:namespace', async (req, _res) => {
    const { username, namespace } = req.params;

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    await removeUserFromNamespace(username, namespace);
  }, requireAPIKey);

export default router;
