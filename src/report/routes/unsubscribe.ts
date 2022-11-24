import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { readFile } from 'fs/promises';
import Joi from 'joi';
import { join } from 'node:path';
import config from '../lib/config';
import { b64ToString } from '../lib/utils';
import { editTaskByIdWithHistory, getTaskById } from '../models/tasks';
import { ArgumentError, NotFoundError } from '../types/errors';

const router = Router();

const rootPath = config.get('rootPath');

type UnsubData = {
  taskId: string,
  email: string
};

const unsubSchema = Joi.object<UnsubData>({
  taskId: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
});

/**
 * Check if input data is a unsubscribe data
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidUnsubData = (data: unknown): data is UnsubData => {
  const validation = unsubSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

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

/**
 * Remove given email in given task
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (!isValidUnsubData(data)) {
      // As validation throws an error, this line shouldn't be called
      return;
    }

    const task = await getTaskById(data.taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const index = task.targets.findIndex((email) => email === data.email);
    if (index < 0) {
      throw new ArgumentError(`Email "${data.email}" not found in targets of task "${task.id}"`);
    }
    task.targets.splice(index, 1);

    await editTaskByIdWithHistory(
      task.id,
      { ...task, layout: task.layout as Prisma.JsonObject },
      { type: 'unsubscription', message: `${data.email} s'est désinscrit de la liste de diffusion.` },
    );

    res.sendJson(await getTaskById(data.taskId));
  } catch (error) {
    res.errorJson(error);
  }
});

export default router;
