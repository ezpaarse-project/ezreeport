import { CustomRouter } from '~/lib/express-utils';
import { getAllowedRoutes, Access } from '~/models/access';

const router = CustomRouter('auth')
  /**
   * Get all user info
   */
  .createSecuredRoute('GET /', Access.READ, (req, _res) => req.user)

  /**
   * Get user's permissions per route
   */
  .createSecuredRoute('GET /permissions', Access.READ, (req, _res) => {
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

    return Object.fromEntries(map);
  });

export default router;
