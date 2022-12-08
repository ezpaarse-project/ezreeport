import { StatusCodes } from 'http-status-codes';
import { CustomRouter } from '../lib/express-utils';
import { checkInstitution } from '../middlewares/auth';
import { getAllHistoryEntries } from '../models/history';
import { Roles } from '../models/roles';

const router = CustomRouter('history')
  /**
   * List all history entries.
   */
  .createSecuredRoute('GET /', Roles.SUPER_USER, checkInstitution, async (req, res) => {
    try {
      const { previous: p = undefined, count = '15' } = req.query;
      const c = +count;

      const entries = await getAllHistoryEntries(
        {
          count: c,
          previous: p?.toString(),
        },
        req.user?.institution,
      );

      res.sendJson(
        entries,
        StatusCodes.OK,
        {
          // total: undefined,
          count: entries.length,
          size: c,
          lastId: entries.at(-1)?.id,
        },
      );
    } catch (error) {
      res.errorJson(error);
    }
  });

export default router;
