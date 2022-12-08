import { CustomRouter } from '../lib/express-utils';
import { Roles } from '../models/roles';
import { getAllTemplates, getTemplateByName } from '../models/templates';

const router = CustomRouter('templates');

/**
 * Get possibles templates
 */
router.createSecuredRoute('GET /', Roles.READ_WRITE, async (req, res) => {
  try {
    res.sendJson(await getAllTemplates());
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get specfific template
 */
router.createSecuredRoute('GET /:name(*)', Roles.READ_WRITE, async (req, res) => {
  try {
    const { name } = req.params;
    res.sendJson(await getTemplateByName(name));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
