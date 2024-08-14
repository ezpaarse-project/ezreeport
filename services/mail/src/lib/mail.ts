import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import mjml2html from 'mjml';
import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import nunjucks from 'nunjucks';
import { differenceInMilliseconds } from 'date-fns';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';

const {
  smtp,
  mail: { sender }, // TODO[feat]: some properties are not used (attempts, interval)
  templates: { dir: templatesPath },
} = config;

nunjucks.configure(templatesPath);
const images = readdirSync(join(templatesPath, 'images'));
const transporter = createTransport(smtp);

transporter.on('error', (err) => {
  logger.error(`[nodemailer] Error on transporter: {${err.message}}`);
});

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

export const SMTPPing = async () => transporter.verify();

export const sendMail = async (options: MailOptions) => {
  const attachments: Mail.Attachment[] = [
    ...images.map((img) => ({ path: join(templatesPath, 'images', img), cid: img, filename: img })),
    ...(options.attachments ?? []),
  ];

  return transporter.sendMail({
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

(async () => {
  const start = new Date();
  try {
    logger.verbose('[nodemailer] Checking SMTP connection...');
    await SMTPPing();

    const end = new Date();
    logger.info(`[nodemailer] Connected to SMTP in [${differenceInMilliseconds(end, start)}]ms`);
  } catch (error) {
    const end = new Date();

    if (error instanceof Error) {
      logger.error(`[nodemailer] Error when trying connection to SMTP in [${differenceInMilliseconds(end, start)}]ms: {${error.message}}`);
    } else {
      logger.error(`[nodemailer] Unexpected error when trying connection to SMTP in [${differenceInMilliseconds(end, start)}]ms: {${error}}`);
    }
  }
})();
