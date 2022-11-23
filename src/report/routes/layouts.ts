import { Router } from 'express';
import checkRight, { Roles } from '../middlewares/auth';

const router = Router();

/**
 * Get possibles layouts
 */
router.get('/layouts', checkRight(Roles.READ_WRITE), async (req, res) => {
  try {
    // const

    res.sendJson([]);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
