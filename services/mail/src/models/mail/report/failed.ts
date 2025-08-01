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

async function getFileFromRemote(
  filename: string,
  id: string
): Promise<string> {
  const stream = await createReportReadStream(filename, id);
  // oxlint-disable-next-line promise/avoid-new
  return new Promise<string>((resolve, reject) => {
    let buffer = '';

    stream
      .on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf-8');
      })
      .on('end', () => resolve(buffer))
      .on('error', (err) => reject(err));
  });
}

function getErrorFromReport(file: string, logger: Logger) {
  try {
    const { detail } = ReportResult.parse(JSON.parse(file));
    if (!detail.error) {
      throw new Error('No error found');
    }

    return `${detail.error.type}: ${detail.error.name} - ${detail.error.message}`;
  } catch (err) {
    logger.warn({
      msg: 'Failed to parse report result',
      err,
    });
    return 'Unknown error, see attachements';
  }
}

export default async function sendFailedReport(
  data: MailReportQueueDataType,
  logger: Logger
): Promise<void> {
  const file = await getFileFromRemote(data.filename, data.task.id);

  const name = basename(data.filename);
  const dateStr = format(data.date, 'dd/MM/yyyy');

  const error = getErrorFromReport(file, logger);

  await sendMail({
    to: [team],
    subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
    body: generateMail('error', {
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
    attachments: [
      {
        filename: name,
        content: file,
        contentDisposition: 'attachment',
      },
    ],
  });

  logger.info({
    filename: name,
    to: [team],
    msg: 'Failed report sent to targets',
  });
}
