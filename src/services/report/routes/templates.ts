import { CustomRouter } from '~/lib/express-utils';
import { Access } from '~/models/access';
import { getAllTemplates, getTemplateByName } from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createSecuredRoute('GET /', Access.READ_WRITE, async (_req, _res) => getAllTemplates())

  /**
   * Get specific template
   */
  .createSecuredRoute('GET /:name(*)', Access.READ_WRITE, async (req, _res) => {
    const { name } = req.params;
    return getTemplateByName(name);
  });

export default router;
