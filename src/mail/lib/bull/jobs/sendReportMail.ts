import type { Job } from 'bull';
import { format, parseISO } from 'date-fns';
import type { MailData } from '..';
import logger from '../../logger';
import { generateMail, sendMail } from '../../mail';
import { recurrenceToStr } from '../../recurrence';

export default async (job: Job<MailData>) => {
  const filename = job.data.url.replace(/^.*\//, '');
  const dateStr = format(parseISO(job.data.date), 'dd/MM/yyyy');

  if (job.data.success) {
    await sendMail({
      to: job.data.task.targets,
      subject: `Reporting ezMESURE [${dateStr}] - ${job.data.task.name}`,
      body: await generateMail(
        'success',
        {
          recurrence: recurrenceToStr(job.data.task.recurrence),
          name: job.data.task.name,
          date: dateStr,
        },
      ),
      attachments: [{
        filename,
        content: Buffer.from(job.data.file, 'base64'),
      }],
    });
    logger.info(`[mail] Report "${filename}" sent to [${job.data.task.targets.join(', ')}]`);
  }
  // TODO[feat]: Add error mail
};
