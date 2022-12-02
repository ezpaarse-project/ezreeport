import { Router } from 'express';
import checkRight, { Roles } from '../middlewares/auth';
import { getAllTemplates, getTemplateByName } from '../models/templates';

const router = Router();

/**
 * Get possibles templates
 */
router.get('/', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    res.sendJson(await getAllTemplates());
  } catch (error) {
    res.errorJson(error);
  }
});

/**
 * Get specfific template
 */
router.get('/:name(*)', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    const { name } = req.params;
    res.sendJson(await getTemplateByName(name));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
