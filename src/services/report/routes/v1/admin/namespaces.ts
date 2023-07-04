import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';

import { requireAPIKey } from '~/middlewares/auth';

import { CustomRouter } from '~/lib/express-utils';

import {
  addUserToNamespace,
  isValidMembership,
  removeUserFromNamespace,
  updateUserOfNamespace
} from '~/models/memberships';
import {
  createNamespace,
  deleteNamespaceById,
  getAllNamespaces,
  editNamespaceById,
  getCountNamespaces,
  getNamespaceById,
  isValidBulkNamespace,
  replaceManyNamespaces,
  isValidNamespace
} from '~/models/namespaces';
import { getUserByUsername } from '~/models/users';
import { ArgumentError, HTTPError, NotFoundError } from '~/types/errors';

const router = CustomRouter('namespaces')
  /**
   * List all namespaces
   */
  .createBasicRoute('GET /', async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const entries = await getAllNamespaces(
      {
        count: c,
        previous: p?.toString(),
      },
    );

    return {
      data: entries,
      code: StatusCodes.OK,
      meta: {
        total: await getCountNamespaces(),
        count: entries.length,
        size: c,
        lastId: entries.at(-1)?.id,
      },
    };
  }, requireAPIKey)

  /**
   * Create a new namespace
   *
   * @deprecated Use `PUT /:namespace` instead
   */
  .createBasicRoute('POST /', async (req, _res) => {
    const { id, ...body } = req.body;

    const validation = Joi.string().validate(id);
    if (validation.error) {
      throw new ArgumentError(`id is not valid: ${validation.error?.message}`);
    }
    // Validate body
    if (!isValidNamespace(body)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    return {
      data: await createNamespace(
        id,
        body,
      ),
      code: StatusCodes.CREATED,
    };
  }, requireAPIKey)

  /**
   * Replace namespaces and/or memberships
   */
  .createBasicRoute('PUT /', (req, _res) => {
    // Validate body
    if (!isValidBulkNamespace(req.body)) {
      // As validation throws an error, this line shouldn't be called
      return null;
    }

    return replaceManyNamespaces(req.body);
  }, requireAPIKey)

  /**
   * Get specific namespace
   */
  .createBasicRoute('GET /:namespace', async (req, _res) => {
    const { namespace: id } = req.params;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new HTTPError(`Namespace with id '${id}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Update or create a namespace
   */
  .createBasicRoute('PUT /:namespace', async (req, _res) => {
    const { namespace: id } = req.params;

    // Validate body
    if (!isValidNamespace(req.body)) {
      // As validation throws an error, this line shouldn't be called
      return Promise.resolve(null);
    }

    let namespace = await getNamespaceById(id);
    let code;
    if (namespace) {
      namespace = await editNamespaceById(id, req.body);
      code = StatusCodes.OK;
    } else {
      namespace = await createNamespace(id, req.body);
      code = StatusCodes.CREATED;
    }

    return {
      code,
      data: namespace,
    };
  }, requireAPIKey)

  /**
   * Delete a namespace
   */
  .createBasicRoute('DELETE /:namespace', async (req, _res) => {
    const { namespace: id } = req.params;

    await deleteNamespaceById(id);
  }, requireAPIKey)

  /**
   * Add a user to a namespace
   *
   * @deprecated Use `PUT /:namespace/members/:username` instead
   */
  .createBasicRoute('POST /:namespace/members', async (req, _res) => {
    const { namespace: id } = req.params;
    const { username, ...data } = req.body;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new NotFoundError(`Namespace "${id}" not found`);
    }

    if (!isValidMembership(data)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    await addUserToNamespace(username, id, data);

    return {
      code: StatusCodes.CREATED,
      data: await getNamespaceById(id),
    };
  }, requireAPIKey)

  /**
   * Get membership of a namespace
   */
  .createBasicRoute('GET /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new NotFoundError(`Namespace "${id}" not found`);
    }

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    const membership = namespace.memberships.find((m) => m.username === username);
    if (!membership) {
      throw new NotFoundError(`User "${username}" is not in namespace "${namespace}"`);
    }

    return membership;
  }, requireAPIKey)

  /**
   * Update or adds a user of a namespace
   */
  .createBasicRoute('PUT /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new NotFoundError(`Namespace "${id}" not found`);
    }

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    if (!isValidMembership(req.body)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    let code;
    if (namespace.memberships.find((m) => m.username === username)) {
      await updateUserOfNamespace(username, id, req.body);
      code = StatusCodes.OK;
    } else {
      await addUserToNamespace(username, id, req.body);
      code = StatusCodes.CREATED;
    }

    return {
      code,
      data: (await getNamespaceById(id))?.memberships.find((m) => m.username === username),
    };
  }, requireAPIKey)

  /**
   * Removes a user from a namespace
   */
  .createBasicRoute('DELETE /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new NotFoundError(`Namespace "${id}" not found`);
    }

    const user = await getUserByUsername(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }

    await removeUserFromNamespace(username, id);
  }, requireAPIKey);

export default router;
