import { CustomRouter } from '~/lib/express-utils';
import { checkInstitution } from '~/middlewares/auth';
import { getAllowedRoutes, Roles } from '~/models/roles';

const router = CustomRouter('auth');

/**
   * Get all user info
   */
router.createSecuredRoute('GET /', Roles.READ, (req, _res) => req.user, checkInstitution);

/**
   * Get user's permissions per route
   */
router.createSecuredRoute('GET /permissions', Roles.READ, (req, _res) => {
  if (req.user) {
    const { maxRolePriority } = req.user;
    return getAllowedRoutes(maxRolePriority as Parameters<typeof getAllowedRoutes>[0]);
  }
  throw new Error('User not found');
});

export default router;
