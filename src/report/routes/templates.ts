import { Router } from 'express';
import { createSecuredRoute } from '../lib/express-utils';
import { Roles } from '../models/roles';
import { getAllTemplates, getTemplateByName } from '../models/templates';

const router = Router();

Object.assign(router, { _permPrefix: 'templates' });

/**
 * Get possibles templates
 */
createSecuredRoute(router, 'GET /', Roles.READ_WRITE, async (req, res) => {
  try {
    res.sendJson(await getAllTemplates());
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get specfific template
 */
createSecuredRoute(router, 'GET /:name(*)', Roles.READ_WRITE, async (req, res) => {
  try {
    const { name } = req.params;
    res.sendJson(await getTemplateByName(name));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
