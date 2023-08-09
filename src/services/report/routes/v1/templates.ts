import { StatusCodes } from 'http-status-codes';

import config from '~/lib/config';
import { CustomRouter } from '~/lib/express-utils';

import { requireUser } from '~/middlewares/auth';

import {
  createTemplate,
  deleteTemplateById,
  editTemplateById,
  getAllTemplates,
  getTemplateById,
  isFullTemplate,
} from '~/models/templates';

const router = CustomRouter('templates')
  /**
   * Get possibles templates
   */
  .createRoute('GET /', async (_req, _res) => {
    const templates = await getAllTemplates();

    return {
      data: templates,
      meta: {
        default: config.defaultTemplate.id,
      },
    };
  }, requireUser)

  /**
   * Create template
   */
  .createAdminRoute('POST /', (req, _res) => {
    const data = req.body;

    if (!isFullTemplate(data)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    return createTemplate(data);
  })

  /**
   * Get specific template
   */
  .createRoute('GET /:template', async (req, _res) => {
    const { template: id } = req.params;

    const template = await getTemplateById(id);
    if (!template) {
      throw new Error(`No template named "${id}" was found`);
    }

    return template;
  }, requireUser)

  /**
   * Edit or create template
   */
  .createAdminRoute('PUT /:template', async (req, _res) => {
    const { template: id } = req.params;

    if (!isFullTemplate(req.body)) {
      // As validation throws an error, this line shouldn't be called
      return {};
    }

    let template = await getTemplateById(id);
    let code;
    if (template) {
      template = await editTemplateById(id, req.body);
      code = StatusCodes.OK;
    } else {
      template = await createTemplate(req.body, id);
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
  .createAdminRoute('DELETE /:template', async (req, _res) => {
    const { template: id } = req.params;

    await deleteTemplateById(id);
  });

export default router;
