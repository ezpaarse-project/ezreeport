import { CustomRouter } from '../lib/express-utils';
import { getAllowedRoutes, Roles } from '../models/roles';

const router = CustomRouter('auth');

/**
   * Get all user info
   */
router.createSecuredRoute('GET /', Roles.READ, (req, res) => {
  res.sendJson({
    ...req.user,
  });
});

/**
   * Get user's permissions per route
   */
router.createSecuredRoute('GET /permissions', Roles.READ, (req, res) => {
  if (req.user) {
    const { maxRolePriority } = req.user;
    res.sendJson(
      getAllowedRoutes(maxRolePriority as Parameters<typeof getAllowedRoutes>[0]),
    );
  } else {
    res.errorJson(new Error('User not found'));
  }
});

export default router;
