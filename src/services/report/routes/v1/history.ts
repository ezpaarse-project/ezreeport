import { StatusCodes } from 'http-status-codes';
import { CustomRouter } from '~/lib/express-utils';
import { getAllHistoryEntries, getCountHistory } from '~/models/history';
import { Access } from '~/models/access';

const router = CustomRouter('history')
  /**
   * List all history entries.
   */
  .createNamespacedRoute('GET /', Access.READ, async (req, _res) => {
    const { previous: p = undefined, count = '15' } = req.query;
    const c = +count;

    const entries = await getAllHistoryEntries(
      {
        count: c,
        previous: p?.toString(),
      },
      req.namespaceIds,
    );

    return {
      data: entries,
      code: StatusCodes.OK,
      meta: {
        total: await getCountHistory(req.namespaceIds),
        count: entries.length,
        size: c,
        lastId: entries.at(-1)?.id,
      },
    };
  });

export default router;
