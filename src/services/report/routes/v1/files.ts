import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { StatusCodes } from 'http-status-codes';
import config from '~/lib/config';
import { CustomRouter } from '~/lib/express-utils';
import { isValidResult } from '~/models/reports';
import { Access } from '~/models/access';
import { getTaskById } from '~/models/tasks';
import { HTTPError } from '~/types/errors';

const { outDir } = config.get('report');

const router = CustomRouter('reports')
  /**
   * Get specific report
   */
  .createNamespacedRoute('GET /:year/:yearMonth/:filename', Access.READ, async (req, res) => {
    const { year, yearMonth, filename } = req.params;
    const reportFilename = filename.replace(/\..*$/, '');
    const basePath = join(outDir, year, yearMonth);

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

    const task = await getTaskById(detailFile.detail.taskId, req.namespaceIds);
    if (task) {
      // Check if wanted file isn't already read
      if (filename === `${reportFilename}.det.json`) {
        res.send(detailFile);
      } else {
        // FIXME: handle No such file error
        res.send(await readFile(join(basePath, filename)));
      }
    } else {
      throw new HTTPError(`No report "${year}/${yearMonth}/${filename}" for your namespace`, StatusCodes.NOT_FOUND);
    }
  });

export default router;
