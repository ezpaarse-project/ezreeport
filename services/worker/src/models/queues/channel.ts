import type rabbitmq from '~/lib/rabbitmq';
import { getConnection } from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'queues' });

let channel: rabbitmq.Channel | undefined;

export default async function getChannel() {
  if (!channel) {
    const connection = await getConnection();

    channel = await connection.createChannel();
    await channel.prefetch(1);
    logger.debug({
      msg: 'Channel created',
      prefetch: 1,
    });
  }
  return channel;
}
