import { Queue, Job } from 'bullmq';
import { format, parseISO } from 'date-fns';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';
import { generateMail, sendMail, type MailOptions } from '~/lib/mail';
import { b64ToString, isFulfilled, stringToB64 } from '~/lib/utils';

import { recurrenceToStr } from '~/models/recurrence';

import type { MailResult } from '..';

const {
  redis,
  mail: { team },
  api: { url: APIurl },
} = config;

export default async (j: Job) => {
  // Re-getting job from it's id and queue to get child jobs
  // See https://github.com/taskforcesh/bullmq/issues/753
  const queue = new Queue<MailResult>(j.queueName, { connection: redis });
  const job = await Job.fromId(queue, j.id ?? '');
  if (!job) {
    throw new Error(`Cannot find job [${j.id}] in queue [${queue.name}]`);
  }

  const data: MailResult = Object.values(await job.getChildrenValues())[0].mailData;

  const filename = data.url.replace(/^.*\//, '');
  const date = parseISO(data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    const options: Omit<MailOptions, 'to' | 'body' | 'subject'> = {
      attachments: [{
        filename,
        content: data.file,
        encoding: 'base64',
      }],
    };
    const bodyData = {
      recurrence: recurrenceToStr(data.task.recurrence),
      name: data.task.name,
      date: dateStr,
    };

    if (data.success) {
      // Send one email per target to allow un-subscription prefill
      const targets = await Promise.allSettled(
        data.task.targets.map(async (to) => {
          try {
            const taskId64 = stringToB64(data.task.id);
            const to64 = stringToB64(to);
            const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

            const unsubscribeLink = `${APIurl}/unsubscribe/${unsubId}`;
            await sendMail({
              ...options,
              to,
              subject: `Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
              body: await generateMail('success', { ...bodyData, unsubscribeLink }),
            });

            return to;
          } catch (error) {
            logger.error(`[mail] Report "${filename}" wan't sent to ${to} with error: ${(error as Error).message}`);
            throw error;
          }
        }),
      );

      const successTargets = targets.filter(isFulfilled).map(({ value }) => value);
      if (successTargets.length > 0) {
        logger.info(`[mail] Report "${filename}" sent to [${successTargets.join(', ')}]`);
      } else {
        logger.error(`[mail] Report "${filename}" wasn't sent to anyone (see previous logs)`);
      }
    } else {
      // TODO[feat]: Ignore team if test report ?
      const to = [data.contact ?? '', team];

      let error: string;
      try {
        const { detail } = JSON.parse(b64ToString(data.file));
        error = detail.error.message;
      } catch (err) {
        error = 'Unknown error, see attachements';
      }

      await sendMail({
        ...options,
        to,
        subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
        body: await generateMail('error', { ...bodyData, error, date: format(date, 'dd/MM/yyyy à HH:mm:ss') }),
      });
      logger.info(`[mail] Error report "${filename}" sent to [${to.filter((v) => v).join(', ')}]`);
    }
  } catch (error) {
    logger.error(`[mail] Error when sending Report "${filename}" : ${(error as Error).message}`);
  }
};
