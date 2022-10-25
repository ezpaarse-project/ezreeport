import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import checkRight, { Roles } from '../middlewares/auth';
import { getAllInstitutions } from '../models/tasks';

const router = Router();

/**
 * Get all organisations of users present in DB
 *
 * Only accessible to Roles.SUPER_USER
 */
router.get('/', checkRight(Roles.READ), async (req, res) => {
  try {
    const { offset = '0', count = '15' } = req.query;
    const o = +offset;
    const c = +count;

    const orgs = await getAllInstitutions({ count: c, offset: o });

    res.sendJson(
      orgs,
      StatusCodes.OK,
      {
        // total: undefined,
        count: orgs.length,
        offset: o,
      },
    );
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
