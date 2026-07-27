import type { Logger } from '@ezreeport/logger';
import type { MailErrorQueueDataType } from '@ezreeport/models/queues';
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
        content: error.file,
        encoding: 'base64',
        filename: error.filename,
      },
    ],
    body: await generateMail('report-failed', locale, {
      data: {
        date: d(date, locale),
        error: t('mail.report.error.message', locale),
        period: { end: '', start: '' },
      },
    }),
    subject: t('mail.report.error.subject', locale, {
      date: d(date, locale, 'P'),
    }),
    to: [team],
  });

  logger.info({
    msg: 'Error report sent to team',
    team,
  });
}
