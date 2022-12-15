import mjml2html from 'mjml';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import nunjucks from 'nunjucks';
import config from './config';

const smtp = config.get('smtp');
const { sender } = config.get('mail'); // TODO[feat]: some properties are not used

nunjucks.configure('templates');
const images = readdirSync('templates/images');
const transporter = createTransport(smtp);

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
  const attachments: Mail.Attachment[] = options.attachments ?? [];

  attachments.push(
    ...images.map((img) => ({ path: join('templates/images', img), cid: img })),
  );

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
