import { Router, type Request } from 'express';
import { readFile } from 'fs/promises';
import { StatusCodes } from 'http-status-codes';
import { join } from 'path';
import config from '../lib/config';
import checkRight, { Roles } from '../middlewares/auth';
import { findInstitutionByCreatorOrRole } from '../models/institutions';
import { getTaskById } from '../models/tasks';
import { HTTPError } from '../types/errors';

const router = Router();

const rootPath = config.get('rootPath');
const { outDir } = config.get('pdf');

/**
 * Get institution of authed user, or given in query param (if user is Roles.SUPER_USER)
 *
 * ! Duplicate of routes/tasks.ts
 *
 * @param req Express request
 *
 * @returns The id of institution
 */
const getAuthedInstitution = async (req: Request): Promise<string | undefined> => {
  if (req.user) {
    if (req.user.roles.includes(Roles.SUPER_USER) && (typeof req.query.institution === 'string' || typeof req.query.institution === 'undefined')) {
      return req.query.institution;
    }
    const { _id: id } = await findInstitutionByCreatorOrRole(req.user.username, req.user.roles);
    return id.toString();
  }
  return undefined;
};

/**
 * Get speficic report
 */
router.get('/:year/:yearMonth/:file', checkRight(Roles.READ), async (req, res) => {
  const { year, yearMonth, file } = req.params; // TODO: check if not trying to access other file
  const fileWithoutExt = file.replace(/\..*$/, '');
  const basePath = join(rootPath, outDir, year, yearMonth);

  try {
    const detailFile = JSON.parse(await readFile(join(basePath, `${fileWithoutExt}.json`), 'utf-8')) as any; // TODO : any ??

    const institution = await getAuthedInstitution(req);
    const task = await getTaskById(detailFile.detail.task, institution);

    if (task) {
      // Check if file isn't already read
      if (`${fileWithoutExt}.json` === file) {
        res.send(detailFile);
      } else {
        // TODO : handle No such file error
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
