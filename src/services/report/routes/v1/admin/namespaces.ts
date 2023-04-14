import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { CustomRouter } from '~/lib/express-utils';
import { requireAPIKey } from '~/middlewares/auth';
import { addUserToNamespace, removeUserFromNamespace, updateUserOfNamespace } from '~/models/memberships';
import {
  createNamespace,
  deleteNamespaceById,
  getAllNamespaces,
  editNamespaceById,
  getCountNamespaces,
  getNamespaceById
} from '~/models/namespaces';
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

    return {
      data: await createNamespace(
        id,
        body,
      ),
      code: StatusCodes.CREATED,
    };
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
      throw new NotFoundError(`Namespace "${namespace}" not found`);
    }

    await addUserToNamespace(username, id, data);

    return {
      code: StatusCodes.CREATED,
      data: await getNamespaceById(id),
    };
  }, requireAPIKey)

  /**
   * Update or adds a user of a namespace
   */
  .createBasicRoute('PUT /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    const namespace = await getNamespaceById(id);
    if (!namespace) {
      throw new NotFoundError(`Namespace "${namespace}" not found`);
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
      throw new NotFoundError(`Namespace "${namespace}" not found`);
    }

    await removeUserFromNamespace(username, id);
  }, requireAPIKey);

export default router;
