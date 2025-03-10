import type { Logger } from 'pino';

import config from '~/lib/config';
import { format } from '~common/lib/date-fns';

import type { MailErrorQueueDataType } from '~common/types/queues';

import { generateMail, sendMail } from '.';

const {
  mail: { team },
} = config;

export default async function sendError({ error, date }: MailErrorQueueDataType, logger: Logger) {
  const dateStr = format(date, 'dd/MM/yyyy');

  await sendMail({
    attachments: [{
      filename: error.filename,
      content: error.file,
      encoding: 'base64',
    }],
    to: [team],
    subject: `Erreur de Reporting ezMESURE [${dateStr}]`,
    body: await generateMail('error', {
      error: 'Unknown error, see attachements',
      date: format(date, 'dd/MM/yyyy à HH:mm:ss'),
      period: { start: '', end: '' },
    }),
  });

  logger.info({
    team,
    msg: 'Error report sent to team',
  });
}
