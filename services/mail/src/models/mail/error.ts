import type { Logger } from '@ezreeport/logger';
import type { MailErrorQueueDataType } from '@ezreeport/models/queues';
import { format } from '@ezreeport/dates';
import { d, t } from '@ezreeport/i18n';

import config from '~/lib/config';

import { generateMail, sendMail } from '.';

const {
  mail: { team },
} = config;

export async function sendError(
  { error, date }: MailErrorQueueDataType,
  logger: Logger
): Promise<void> {
  const locale = 'en';

  await sendMail({
    attachments: [
      {
        filename: error.filename,
        content: error.file,
        encoding: 'base64',
      },
    ],
    to: [team],
    subject: t('mail.report.error.subject', locale, {
      date: d(date, locale, 'P'),
    }),
    body: await generateMail('report-failed', locale, {
      data: {
        error: t('mail.report.error.message', locale),
        date: d(date, locale),
        period: { start: '', end: '' },
      },
    }),
  });

  logger.info({
    team,
    msg: 'Error report sent to team',
  });
}
