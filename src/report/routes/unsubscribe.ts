import { Router } from 'express';
import { readFile } from 'fs/promises';
import Joi from 'joi';
import { join } from 'node:path';
import config from '../lib/config';
import { b64ToString } from '../lib/utils';
import { getTaskById } from '../models/tasks';
import { ArgumentError, NotFoundError } from '../types/errors';

const router = Router();

const rootPath = config.get('rootPath');

/**
 * Get unsubscribe static UI
 */
router.get('/:unsubId', async (req, res) => {
  try {
    const { unsubId } = req.params;

    const [taskId64, to64] = decodeURIComponent(unsubId).split(':');

    const task = await getTaskById(b64ToString(taskId64));
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const email = b64ToString(to64);
    const { error } = Joi.string().email().validate(email);
    if (error) {
      throw new ArgumentError(`Body is not valid: ${error.message}`);
    }

    const path = join(rootPath, 'assets/public/unsubscribe.html');
    const template = await readFile(path, 'utf8');

    const html = template
      // eslint-disable-next-line no-template-curly-in-string
      .replaceAll('${unsubId}', unsubId)
      // eslint-disable-next-line no-template-curly-in-string
      .replaceAll('${taskName}', task.name)
      // eslint-disable-next-line no-template-curly-in-string
      .replaceAll('${taskId}', task.id)
      // eslint-disable-next-line no-template-curly-in-string
      .replaceAll('${email}', email);

    res.send(html);
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
