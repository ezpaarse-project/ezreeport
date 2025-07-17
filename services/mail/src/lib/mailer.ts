import { createTransport, type Transporter } from 'nodemailer';

import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

let transporter: Transporter | undefined;

const logger = appLogger.child({ scope: 'nodemailer' });

const { smtp } = config;

export function getMailer(): Transporter {
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

export const SMTPPing = async (): Promise<HeartbeatType> => {
  const transport = getMailer();
  await transport.verify();

  return {
    hostname: smtp.host,
    service: 'smtp',
    version: transport.transporter.version.split('[')[0],
    updatedAt: new Date(),
  };
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
