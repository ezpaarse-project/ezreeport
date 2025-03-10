import amqp from 'amqplib';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

const logger = appLogger.child(
  { scope: 'RabbitMQ' },
  {
    redact: {
      paths: ['config.password'],
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
    },
  },
);

let connection: amqp.ChannelModel | undefined;

export async function getConnection() {
  if (!connection) {
    connection = await amqp.connect({
      hostname: config.rabbitmq.host,
      vhost: config.rabbitmq.vhost,
      protocol: config.rabbitmq.protocol,
      username: config.rabbitmq.username,
      password: config.rabbitmq.password,
    });

    logger.info({
      msg: 'Connected to RabbitMQ',
      config: config.rabbitmq,
    });
  }
  return connection;
}

process.on('SIGTERM', () => {
  connection?.close()
    .then(() => logger.debug('Connection closed'))
    .catch((err) => logger.error({ msg: 'Failed to close connection', err }));
});

export default amqp;
