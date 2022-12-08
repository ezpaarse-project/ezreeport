import { StatusCodes } from 'http-status-codes';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../lib/config';
import { CustomRouter } from '../lib/express-utils';
import { checkInstitution } from '../middlewares/auth';
import { isValidResult } from '../models/reports';
import { Roles } from '../models/roles';
import { getTaskById } from '../models/tasks';
import { HTTPError } from '../types/errors';

const { outDir } = config.get('report');

const router = CustomRouter('reports')
  /**
   * Get speficic report
   */
  .createSecuredRoute('GET /:year/:yearMonth/:filename', Roles.READ, checkInstitution, async (req, res) => {
    const { year, yearMonth, filename } = req.params;
    const reportFilename = filename.replace(/\..*$/, '');
    const basePath = join(outDir, year, yearMonth);

    try {
      // Check if not trying to access unwanted file
      const path = join(basePath, `${reportFilename}.det.json`);
      if (new RegExp(`^${outDir}/.*\\.det\\.json$`, 'i').test(path) === false) {
        throw new HTTPError(`File path must be in the "${outDir}" folder. Resolved: "${path}"`, StatusCodes.BAD_REQUEST);
      }

      const detailFile = JSON.parse(await readFile(path, 'utf-8')) as unknown;
      if (!isValidResult(detailFile)) {
        // As validation throws an error, this line shouldn't be called
        return;
      }

      const task = await getTaskById(detailFile.detail.taskId, req.user?.institution);
      if (task) {
        // Check if wanted file isn't already read
        if (filename === `${reportFilename}.det.json`) {
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
