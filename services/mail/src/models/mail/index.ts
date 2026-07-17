import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type Mail from 'nodemailer/lib/mailer';
import mjml2html from 'mjml';
import nunjucks from 'nunjucks';

import type { MailReportQueueDataType } from '@ezreeport/models/queues';
import type { TemplateLocaleType } from '@ezreeport/models/templates';
import { format } from '@ezreeport/dates';
import { type Phrase, t } from '@ezreeport/i18n';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { getMailer } from '~/lib/mailer';

const logger = appLogger.child({ scope: 'mails' });

const {
  mail: { sender, templateDir, team }, // TODO[feat]: some properties are not used (attempts, interval)
  api: { home },
} = config;

nunjucks.configure(templateDir);
const images = readdirSync(join(templateDir, 'images'));

export type MailOptions = {
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
  attachments?: Mail.Attachment[];
};

export function getFilename(data: MailReportQueueDataType): string {
  let filename = [
    'ezREEPORT',
    data.task.name,
    format(data.period.start, 'yyyy-MM-dd'),
    format(data.period.end, 'yyyy-MM-dd'),
  ].join('_');

  const [, type, extension] =
    /\.([a-z]+)\.([a-z]+)$/i.exec(data.filename) ?? [];

  if (type !== 'rep') {
    filename += `.${type}`;
  }
  filename += `.${extension}`;

  return filename;
}

export function sendMail(options: MailOptions): Promise<void> {
  const attachments: Mail.Attachment[] = [
    ...images.map((img) => ({
      path: join(templateDir, 'images', img),
      cid: img,
      filename: img,
    })),
    ...(options.attachments ?? []),
  ];

  return getMailer().sendMail({
    from: sender,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    ...options.body,
    attachments,
  });
}

export async function generateMail(
  template: string,
  locale: TemplateLocaleType,
  data: object
): Promise<{ html: string; text: string }> {
  const context = {
    ...data,
    $t: (phrase: Phrase, replacements: Record<string, string> = {}) =>
      t(phrase, locale, replacements),
    HOME_URL: home,
    MAIL_TEAM: team,
  };

  const text = nunjucks.render(`${template}.txt`, context);
  const mjml = nunjucks.render(`${template}.mjml`, context);
  const { html } = await mjml2html(mjml);

  return { html, text };
}

export function initSMTP(): void {
  const start = process.uptime();

  getMailer();

  logger.info({
    duration: process.uptime() - start,
    durationUnit: 's',
    msg: 'Init completed',
  });
}
