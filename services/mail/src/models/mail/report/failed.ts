import type { Logger } from 'pino';

import { format } from '~common/lib/date-fns';
import { b64ToString } from '~common/lib/utils';
import config from '~/lib/config';

import type { MailReportQueueDataType } from '~common/types/queues';
import { recurrenceToStr } from '~/models/recurrence';

import { generateMail, sendMail } from '..';

const {
  mail: { team },
} = config;

export default async function sendFailedReport(
  data: MailReportQueueDataType,
  logger: Logger,
) {
  const dateStr = format(data.date, 'dd/MM/yyyy');
  const to = [team];

  let error: string;
  try {
    const { detail } = JSON.parse(b64ToString(data.file));
    error = detail.error.message;
  } catch (err) {
    error = 'Unknown error, see attachements';
  }

  await sendMail({
    to,
    subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
    body: await generateMail('error', {
      recurrence: recurrenceToStr(data.task.recurrence),
      name: data.task.name,
      namespace: data.namespace.name,
      date: format(data.date, 'dd/MM/yyyy à HH:mm:ss'),
      period: {
        start: format(data.period.start, 'dd/MM/yyyy'),
        end: format(data.period.end, 'dd/MM/yyyy'),
      },
      error,
    }),
    attachments: [{
      filename: data.filename,
      content: data.file,
      encoding: 'base64',
    }],
  });
  logger.info({
    filename: data.filename,
    to,
    msg: 'Failed report sent to targets',
  });
}
