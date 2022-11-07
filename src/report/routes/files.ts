import { Router } from 'express';
import { readFile } from 'fs/promises';
import { StatusCodes } from 'http-status-codes';
import { join } from 'path';
import config from '../lib/config';
import checkRight, { checkInstitution, Roles } from '../middlewares/auth';
import { getTaskById } from '../models/tasks';
import { HTTPError } from '../types/errors';

const router = Router();

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

/**
 * Get speficic report
 */
router.get('/:year/:yearMonth/:file', checkRight(Roles.READ), checkInstitution, async (req, res) => {
  // FIXME: check if not trying to access other file
  const { year, yearMonth, file } = req.params;
  const fileWithoutExt = file.replace(/\..*$/, '');
  const basePath = join(rootPath, outDir, year, yearMonth);

  try {
    // TODO[type]: Check with JOI
    const detailFile = JSON.parse(await readFile(join(basePath, `${fileWithoutExt}.json`), 'utf-8')) as any;

    const task = await getTaskById(detailFile.detail.task, req.user?.institution);

    if (task) {
      // Check if file isn't already read
      if (`${fileWithoutExt}.json` === file) {
        res.send(detailFile);
      } else {
        // FIXME: handle No such file error
        res.send(await readFile(join(basePath, file)));
      }
    } else {
      throw new HTTPError(`No report "${year}/${yearMonth}/${file}" for your organisation`, StatusCodes.NOT_FOUND);
    }
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
