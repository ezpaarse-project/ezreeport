import { CustomRouter } from '~/lib/express-utils';
import { Access } from '~/models/access';
import {
  createTemplate,
  deleteTemplateByName, editTemplateByName, getAllTemplates, getTemplateByName
} from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createNamespacedRoute('GET /', Access.READ, (_req, _res) => getAllTemplates())

  /**
   * Create template
   */
  .createAdminRoute('POST /', (req, _res) => {
    const { name, ...data } = req.body;

    return createTemplate(name, data);
  })

  /**
   * Get specific template
   */
  .createNamespacedRoute('GET /:name(*)', Access.READ, async (req, _res) => {
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
  .createAdminRoute('PUT /:name(*)', async (req, _res) => {
    const { name } = req.params;

    const template = await editTemplateByName(name, req.body);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  })

  /**
   * Delete template
   */
  .createAdminRoute('DELETE /:name(*)', async (req, _res) => {
    const { name } = req.params;

    const template = await deleteTemplateByName(name);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  });

export default router;
