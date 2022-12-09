import { StatusCodes } from 'http-status-codes';
import { CustomRouter } from '../lib/express-utils';
import { checkInstitution } from '../middlewares/auth';
import { getAllHistoryEntries } from '../models/history';
import { Roles } from '../models/roles';

const router = CustomRouter('history')
  /**
   * List all history entries.
   */
  .createSecuredRoute('GET /', Roles.SUPER_USER, async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const entries = await getAllHistoryEntries(
      {
        count: c,
        previous: p?.toString(),
      },
      req.user?.institution,
    );

    return {
      data: entries,
      code: StatusCodes.OK,
      meta: {
        // total: undefined,
        count: entries.length,
        size: c,
        lastId: entries.at(-1)?.id,
      },
    };
  }, checkInstitution);

export default router;
