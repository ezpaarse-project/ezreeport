import { readFile } from 'fs/promises';
import { compile as handlebars } from 'handlebars';
import Joi from 'joi';
import { CustomRouter } from '../lib/express-utils';
import { b64ToString } from '../lib/utils';
import { getTaskById } from '../models/tasks';
import { ArgumentError, NotFoundError } from '../types/errors';

const router = CustomRouter('unsub')
  /**
   * Get unsubscribe static UI
   */
  .createRoute('GET /:unsubId', async (req, res) => {
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

    const template = await readFile('public/unsubscribe.html', 'utf8');

    const html = handlebars(template)({ task, unsubId, email });
    res.send(html);
  });

export default router;
