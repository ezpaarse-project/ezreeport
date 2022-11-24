import type { Job } from 'bull';
import { format, parseISO } from 'date-fns';
import type { MailData } from '..';
import config from '../../config';
import logger from '../../logger';
import { generateMail, sendMail, type MailOptions } from '../../mail';
import { recurrenceToStr } from '../../recurrence';

const { team } = config.get('mail');
const { domain: APIdomain } = config.get('api');

export default async (job: Job<MailData>) => {
  const filename = job.data.url.replace(/^.*\//, '');
  const date = parseISO(job.data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    const options: Omit<MailOptions, 'to' | 'body' | 'subject'> = {
      attachments: [{
        filename,
        content: Buffer.from(job.data.file, 'base64'),
      }],
    };
    const bodyData = {
      recurrence: recurrenceToStr(job.data.task.recurrence),
      name: job.data.task.name,
      date: dateStr,
    };

    if (job.data.success) {
      // Send one email per target to allow unsubscription prefill
      const targets = await Promise.allSettled(
        job.data.task.targets.map(async (to) => {
          try {
            const taskId64 = Buffer.from(job.data.task.id).toString('base64');
            const to64 = Buffer.from(to).toString('base64');
            const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

            const unsubscribeLink = `${APIdomain}/unsubscribe/${unsubId}`;
            await sendMail({
              ...options,
              to,
              subject: `Reporting ezMESURE [${dateStr}] - ${job.data.task.name}`,
              body: await generateMail('success', { ...bodyData, unsubscribeLink }),
            });

            return to;
          } catch (error) {
            logger.error(`[mail] Report "${filename}" wan't sent to ${to} with error: ${(error as Error).message}`);
            throw error;
          }
        }),
      );

      const successTargets = targets.map((v) => (v.status === 'fulfilled' ? v.value : '')).filter((v) => v);
      if (successTargets.length > 0) {
        logger.info(`[mail] Report "${filename}" sent to [${successTargets.join(', ')}]`);
      } else {
        logger.error(`[mail] Report "${filename}" wasn't sent to anyone (see previous logs)`);
      }
    } else {
      const to = [job.data.contact ?? '', team];
      await sendMail({
        ...options,
        to,
        subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${job.data.task.name}`,
        body: await generateMail('error', { ...bodyData, date: format(date, 'dd/MM/yyyy à HH:mm:ss') }),
      });
      logger.info(`[mail] Error report "${filename}" sent to [${to.filter((v) => v).join(', ')}]`);
    }
  } catch (error) {
    logger.error(`[mail] Error when sending Report "${filename}" : ${(error as Error).message}`);
  }
};
