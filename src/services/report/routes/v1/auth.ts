import { CustomRouter } from '~/lib/express-utils';
import { requireUser } from '~/middlewares/auth';
import { Access, getAllowedRoutes, getRoutes } from '~/models/access';

const router = CustomRouter('auth')
  /**
   * Get all user info
   */
  .createRoute('GET /', (req, _res) => req.user, requireUser)

  /**
   * Get namespaces that user can access
   */
  .createNamespacedRoute('GET /namespaces', Access.READ, (req, _res) => req.namespaces?.map(({ namespace }) => namespace) ?? [])

  /**
   * Get user's permissions per route
   */
  .createNamespacedRoute('GET /permissions', Access.READ, (req, _res) => {
    const map = new Map<string, Record<string, boolean>>();

    // eslint-disable-next-line no-restricted-syntax
    for (const membership of req.namespaces ?? []) {
      map.set(
        membership.namespace.id,
        Object.fromEntries(
          getAllowedRoutes(membership.access),
        ),
      );
    }

    return {
      general: Object.fromEntries(getRoutes(req.user?.isAdmin ?? false)),
      namespaces: Object.fromEntries(map),
    };
  });

export default router;
