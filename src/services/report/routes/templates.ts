import { CustomRouter } from '~/lib/express-utils';
import { requireUser } from '~/middlewares/auth';
import {
  createTemplate,
  deleteTemplateByName, editTemplateByName, getAllTemplates, getTemplateByName
} from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createRoute('GET /', (_req, _res) => getAllTemplates(), requireUser)

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
  .createRoute('GET /:name(*)', async (req, _res) => {
    const { name } = req.params;

    const template = await getTemplateByName(name);
    if (!template) {
      throw new Error(`No template named "${name}" was found`);
    }

    return template;
  }, requireUser)

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
