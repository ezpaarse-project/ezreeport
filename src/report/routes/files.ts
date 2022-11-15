import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import checkRight, { checkInstitution, Roles } from '../middlewares/auth';
import { isValidResult } from '../models/reports';
import { getTaskById } from '../models/tasks';
import { HTTPError } from '../types/errors';

const router = Router();

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

/**
 * Get speficic report
 */
router.get('/:year/:yearMonth/:filename', checkRight(Roles.READ), checkInstitution, async (req, res) => {
  // FIXME: check if not trying to access other file
  const { year, yearMonth, filename } = req.params;
  const fileWithoutExt = filename.replace(/\..*$/, '');
  const basePath = join(rootPath, outDir, year, yearMonth);

  try {
    const detailFile = JSON.parse(await readFile(join(basePath, `${fileWithoutExt}.json`), 'utf-8')) as unknown;
    if (!isValidResult(detailFile)) {
      // As validation throws an error, this line shouldn't be called
      return;
    }

    const task = await getTaskById(detailFile.detail.task, req.user?.institution);
    if (task) {
      // Check if file isn't already read
      if (`${fileWithoutExt}.json` === filename) {
        res.send(detailFile);
      } else {
        // FIXME: handle No such file error
        res.send(await readFile(join(basePath, filename)));
      }
    } else {
      throw new HTTPError(`No report "${year}/${yearMonth}/${filename}" for your organisation`, StatusCodes.NOT_FOUND);
    }
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
