import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import checkRight, { Roles } from '../middlewares/auth';
import { getAllHistoryEntries } from '../models/history';

const router = Router();

/**
 * List all history entries.
 */
router.get('/', checkRight(Roles.SUPER_USER), async (req, res) => {
  try {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const entries = await getAllHistoryEntries(
      {
        count: c,
        previous: p?.toString(),
      },
    );

    res.sendJson(
      entries,
      StatusCodes.OK,
      {
        // total: undefined,
        count: entries.length,
        lastId: entries.at(-1)?.id,
      },
    );
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
