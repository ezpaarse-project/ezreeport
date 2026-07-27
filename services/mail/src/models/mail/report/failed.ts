import type { Logger } from '@ezreeport/logger';
import type { MailReportQueueDataType } from '@ezreeport/models/queues';
import type { TemplateLocaleType } from '@ezreeport/models/templates';
import { d, t } from '@ezreeport/i18n';
import { ReportResult } from '@ezreeport/models/reports';

import config from '~/lib/config';

import { createReportReadStream } from '~/models/rpc/client/files';

import { generateMail, getFilename, sendMail } from '..';

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
        buffer += chunk.toString('utf8');
      })
      .on('end', () => resolve(buffer))
      .on('error', (err) => reject(err));
  });
}

function getErrorFromReport(
  file: string,
  logger: Logger,
  locale: TemplateLocaleType
) {
  try {
    const { detail } = ReportResult.parse(JSON.parse(file));
    if (!detail.error) {
      throw new Error('No error found');
    }

    return `${detail.error.type}: ${detail.error.name} - ${detail.error.message}`;
  } catch (error) {
    logger.warn({
      err: error,
      msg: 'Failed to parse report result',
    });
    return t('mail.report.error.message', locale);
  }
}

export async function sendFailedReport(
  data: MailReportQueueDataType,
  logger: Logger
): Promise<void> {
  const file = await getFileFromRemote(data.filename, data.task.id);

  const filename = getFilename(data);

  const error = getErrorFromReport(file, logger, data.locale);

  await sendMail({
    attachments: [
      {
        content: file,
        contentDisposition: 'attachment',
        filename,
      },
    ],
    body: await generateMail('report-failed', data.locale, {
      data: {
        date: d(data.date, data.locale),
        error,
        name: data.task.name,
        namespace: data.namespace.name,
        periodEnd: d(data.period.end, data.locale, 'P'),
        periodStart: d(data.period.start, data.locale, 'P'),
        recurrence: t(`recurrence.${data.task.recurrence}`, data.locale),
      },
    }),
    subject: t('mail.report.failed.subject', data.locale, {
      date: d(data.date, data.locale, 'P'),
      name: data.task.name,
    }),
    to: [team],
  });

  logger.info({
    filename,
    msg: 'Failed report sent to targets',
    to: [team],
  });
}
