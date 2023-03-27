import { StatusCodes } from 'http-status-codes';
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
import { HTTPError } from '~/types/errors';

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
   */
  .createBasicRoute('POST /', async (req, _res) => ({
    data: await createNamespace(
      req.body,
    ),
    code: StatusCodes.CREATED,
  }), requireAPIKey)

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
   * Update a namespace
   */
  .createBasicRoute('PUT /:namespace', async (req, _res) => {
    const { namespace: id } = req.params;

    const namespace = await editNamespaceById(id, req.body);
    if (!namespace) {
      throw new HTTPError(`Namespace with id '${id}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Delete a namespace
   */
  .createBasicRoute('DELETE /:namespace', async (req, _res) => {
    const { namespace: id } = req.params;

    const namespace = await deleteNamespaceById(id);
    if (!namespace) {
      throw new HTTPError(`Namespace with id '${id}' not found`, StatusCodes.NOT_FOUND);
    }

    return namespace;
  }, requireAPIKey)

  /**
   * Add a user to a namespace
   */
  .createBasicRoute('POST /:namespace/members', async (req, _res) => {
    const { namespace: id } = req.params;
    const { username, ...data } = req.body;

    await addUserToNamespace(username, id, data);

    return getNamespaceById(id);
  }, requireAPIKey)

  /**
   * Update a user of a namespace
   */
  .createBasicRoute('PUT /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    await updateUserOfNamespace(username, id, req.body);

    return getNamespaceById(id);
  }, requireAPIKey)

  /**
   * Delete a user from a namespace
   */
  .createBasicRoute('DELETE /:namespace/members/:username', async (req, _res) => {
    const { namespace: id, username } = req.params;

    await removeUserFromNamespace(username, id);

    return getNamespaceById(id);
  }, requireAPIKey);

export default router;
