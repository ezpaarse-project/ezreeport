import type { Job } from 'bull';
import { format, parseISO } from 'date-fns';
import type { MailData } from '..';
import config from '../../config';
import logger from '../../logger';
import { generateMail, sendMail, type MailOptions } from '../../mail';
import { recurrenceToStr } from '../../recurrence';

const { team } = config.get('mail');

export default async (job: Job<MailData>) => {
  const filename = job.data.url.replace(/^.*\//, '');
  const date = parseISO(job.data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    const options: Omit<MailOptions, 'body' | 'subject'> = {
      to: job.data.task.targets,
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
      await sendMail({
        ...options,
        subject: `Reporting ezMESURE [${dateStr}] - ${job.data.task.name}`,
        body: await generateMail('success', bodyData),
      });
    } else {
      await sendMail({
        ...options,
        to: [team],
        // to: [...job.data.task.targets, team],
        subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${job.data.task.name}`,
        body: await generateMail('error', { ...bodyData, date: format(date, 'dd/MM/yyyy à HH:mm:ss') }),
      });
    }
    logger.info(`[mail] Report "${filename}" sent to [${job.data.task.targets.join(', ')}]`);
  } catch (error) {
    logger.error(`[mail] Error when sending Report "${filename}" : ${(error as Error).message}`);
  }
};
