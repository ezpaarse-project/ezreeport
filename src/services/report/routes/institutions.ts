import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { StatusCodes } from 'http-status-codes';
import { CustomRouter } from '~/lib/express-utils';
import {
  findAllInstitutions,
  findInstitutionByCreatorOrRole,
  findInstitutionByIds,
  type TypedElasticInstitution
} from '~/models/institutions';
import { getRoleValue, Roles } from '~/models/roles';
import { HTTPError } from '~/types/errors';

const parseInstitution = (hit: ElasticTypes.SearchHit<TypedElasticInstitution>) => ({
  ...(hit as Required<typeof hit>)._source.institution,
  id: hit._id.toString(),
});

const router = CustomRouter('institutions')
  /**
   * Get user's available institution
   */
  .createSecuredRoute('GET /', Roles.READ, async (req, _res) => {
    if (req.user) {
      const defInstitution = (await findInstitutionByCreatorOrRole(
        req.user.username,
        req.user.roles,
      ));

      // TODO [feat]: Add pagination

      let available: ElasticInstitution[] = [];
      if (req.user.maxRolePriority === getRoleValue(Roles.SUPER_USER)) {
        // SUPER USERS have access to all institutions
        available = (await findAllInstitutions())
          .filter(({ _source }) => _source)
          .map(parseInstitution);
      } else if (defInstitution && defInstitution._source) {
        // TODO [feat]: List all possible institutions once it's allowed by ezMesure
        available = [
          parseInstitution(defInstitution),
        ];
      }

      return available;
    }
    throw new Error('User not found');
  })

  /**
   * Get specfic institution available for the user
   */
  .createSecuredRoute('GET /:id', Roles.READ, async (req, _res) => {
    const { id } = req.params;

    const [institution] = await findInstitutionByIds([id]);
    if (!institution) {
      throw new HTTPError(`Institution "${id}" not found`, StatusCodes.NOT_FOUND);
    }

    // TODO [feat]: Check if available

    return parseInstitution(institution);
  });

export default router;
