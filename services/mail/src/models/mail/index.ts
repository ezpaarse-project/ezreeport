import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type Mail from 'nodemailer/lib/mailer';
import mjml2html from 'mjml';
import nunjucks from 'nunjucks';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { getMailer } from '~/lib/mailer';

const logger = appLogger.child({ scope: 'mails' });

const {
  mail: { sender, templateDir }, // TODO[feat]: some properties are not used (attempts, interval)
} = config;

nunjucks.configure(templateDir);
const images = readdirSync(join(templateDir, 'images'));

export type MailOptions = {
  to: string[] | string,
  cc?: string[] | string,
  bcc?: string[] | string,
  subject: string,
  body: {
    html: string,
    text: string,
  },
  attachments?: Mail.Attachment[],
};

export const sendMail = async (options: MailOptions) => {
  const attachments: Mail.Attachment[] = [
    ...images.map((img) => ({ path: join(templateDir, 'images', img), cid: img, filename: img })),
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
};

export const generateMail = async (template: string, data: object) => {
  const text = nunjucks.render(`${template}.txt`, data);
  const mjml = nunjucks.render(`${template}.mjml`, data);
  const { html } = mjml2html(mjml);

  return { html, text };
};

export async function initSMTP() {
  const start = process.uptime();

  getMailer();

  logger.info({
    duration: process.uptime() - start,
    durationUnit: 's',
    msg: 'Init completed',
  });
}
