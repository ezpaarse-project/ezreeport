import { StatusCodes } from 'http-status-codes';
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
   *
   * @deprecated Use `PUT /:name(*)` instead
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
   * Edit or create template
   */
  .createAdminRoute('PUT /:name(*)', async (req, _res) => {
    const { name } = req.params;

    let template = await getTemplateByName(name);
    let code;
    if (template) {
      template = await editTemplateByName(name, req.body);
      code = StatusCodes.OK;
    } else {
      template = await createTemplate(name, req.body);
      code = StatusCodes.CREATED;
    }

    return {
      code,
      data: template,
    };
  })

  /**
   * Delete template
   */
  .createAdminRoute('DELETE /:name(*)', async (req, _res) => {
    const { name } = req.params;

    await deleteTemplateByName(name);
  });

export default router;
