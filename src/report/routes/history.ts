import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createSecuredRoute } from '../lib/express-utils';
import { getAllHistoryEntries } from '../models/history';
import { Roles } from '../models/roles';

const router = Router();

Object.assign(router, { _permPrefix: 'history' });

/**
 * List all history entries.
 */
createSecuredRoute(router, 'GET /', Roles.SUPER_USER, async (req, res) => {
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
