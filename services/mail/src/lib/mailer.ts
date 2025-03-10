import { createTransport, type Transporter } from 'nodemailer';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

let transporter: Transporter | undefined;

const logger = appLogger.child({ scope: 'nodemailer' });

const {
  smtp,
} = config;

export function getMailer() {
  if (!transporter) {
    transporter = createTransport(smtp);
    transporter.on('error', (err) => {
      logger.error({
        err,
        msg: 'Error on transporter',
      });
    });

    logger.debug({
      msg: 'Connected to SMTP',
      smtp,
    });
  }

  return transporter;
}

export const SMTPPing = async () => {
  const t = getMailer();
  return t.verify();
};

process.on('SIGTERM', () => {
  if (!transporter) {
    return;
  }

  try {
    transporter.close();
    logger.debug('Connection closed');
  } catch (err) {
    logger.error({ msg: 'Failed to close connection', err });
  }
});
