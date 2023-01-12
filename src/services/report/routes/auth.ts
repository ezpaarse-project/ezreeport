import { CustomRouter } from '~/lib/express-utils';
import { checkInstitution } from '~/middlewares/auth';
import { findAllInstitutions, findInstitutionByCreatorOrRole } from '~/models/institutions';
import { getAllowedRoutes, getRoleValue, Roles } from '~/models/roles';

const router = CustomRouter('auth')
  /**
   * Get all user info
   */
  .createSecuredRoute('GET /', Roles.READ, (req, _res) => req.user, checkInstitution)

  /**
   * Get user's permissions per route
   */
  .createSecuredRoute('GET /permissions', Roles.READ, (req, _res) => {
    if (req.user) {
      const { maxRolePriority } = req.user;
      return getAllowedRoutes(maxRolePriority as Parameters<typeof getAllowedRoutes>[0]);
    }
    throw new Error('User not found');
  })

  /**
   * Get user's available institution
   */
  .createSecuredRoute('GET /institutions', Roles.READ, async (req, _res) => {
    if (req.user) {
      const defInstitution = (await findInstitutionByCreatorOrRole(
        req.user.username,
        req.user.roles,
      ));

      let available: ElasticInstitution[] = [];
      if (req.user.maxRolePriority === getRoleValue(Roles.SUPER_USER)) {
        // SUPER USERS have access to all institutions
        available = (await findAllInstitutions())
          .filter(({ _source }) => _source)
          .map((hit) => ({
            ...(hit as Required<typeof hit>)._source.institution,
            id: hit._id.toString(),
          }));
      } else if (defInstitution && defInstitution._source) {
        available = [
          {
            ...defInstitution._source.institution,
            id: defInstitution._id.toString(),
          },
        ];
      }
      // TODO: List all possible institutions once it's allowed by ezMesure

      return {
        default: defInstitution?._id,
        available,
      };
    }
    throw new Error('User not found');
  });

export default router;
