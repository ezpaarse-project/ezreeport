import { CustomRouter } from '~/lib/express-utils';
import { Roles } from '~/models/roles';
import { getAllTemplates, getTemplateByName } from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createSecuredRoute('GET /', Roles.READ_WRITE, async (_req, _res) => getAllTemplates())

  /**
   * Get specfific template
   */
  .createSecuredRoute('GET /:name(*)', Roles.READ_WRITE, async (req, _res) => {
    const { name } = req.params;
    return getTemplateByName(name);
  });

export default router;
