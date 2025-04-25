import { basename } from 'node:path';

import type { Logger } from '@ezreeport/logger';

import { format } from '@ezreeport/dates';
import { ReportResult } from '@ezreeport/models/reports';
import type { MailReportQueueDataType } from '@ezreeport/models/queues';

import config from '~/lib/config';

import { recurrenceToStr } from '~/models/recurrence';
import { createReportReadStream } from '~/models/rpc/client/files';

import { generateMail, sendMail } from '..';

const {
  mail: { team },
} = config;

export default async function sendFailedReport(
  data: MailReportQueueDataType,
  logger: Logger,
) {
  const remoteStream = await createReportReadStream(data.filename, data.task.id);
  const file = await new Promise<string>((resolve, reject) => {
    let buffer = '';

    remoteStream
      .on('data', (chunk) => { buffer += chunk.toString('utf-8'); })
      .on('end', () => resolve(buffer))
      .on('error', (err) => reject(err));
  });

  const name = basename(data.filename);
  const dateStr = format(data.date, 'dd/MM/yyyy');

  let error: string;
  try {
    const { detail } = ReportResult.parse(JSON.parse(file));
    if (!detail.error) {
      throw new Error('No error found');
    }

    error = `${detail.error.type}: ${detail.error.name} - ${detail.error.message}`;
  } catch (err) {
    logger.warn({
      msg: 'Failed to parse report result',
      err,
    });
    error = 'Unknown error, see attachements';
  }

  await sendMail({
    to: [team],
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
      filename: name,
      content: file,
    }],
  });

  logger.info({
    filename: name,
    to: [team],
    msg: 'Failed report sent to targets',
  });
}
