import { CustomRouter } from '~/lib/express-utils';
import { requireAdmin, requireUser } from '~/middlewares/auth';
import { Access } from '~/models/access';
import {
  createTemplate,
  deleteTemplateByName, editTemplateByName, getAllTemplates, getTemplateByName
} from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createSecuredRoute('GET /', Access.READ, (_req, _res) => getAllTemplates())

  /**
   * Create template
   */
  .createRoute('POST /', (req, _res) => {
    const { name, ...data } = req.body;

    return createTemplate(name, data);
  }, requireUser, requireAdmin)

  /**
   * Get specific template
   */
  .createSecuredRoute('GET /:name(*)', Access.READ, async (req, _res) => {
    const { name } = req.params;

    const template = await getTemplateByName(name);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  })

  /**
   * Edit template
   */
  .createRoute('PUT /:name(*)', async (req, _res) => {
    const { name } = req.params;

    const template = await editTemplateByName(name, req.body);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  }, requireUser, requireAdmin)

  /**
   * Delete template
   */
  .createRoute('DELETE /:name(*)', async (req, _res) => {
    const { name } = req.params;

    const template = await deleteTemplateByName(name);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  }, requireUser, requireAdmin);

export default router;
