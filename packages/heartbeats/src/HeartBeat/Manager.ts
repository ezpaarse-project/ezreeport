import type {
  rabbitmq,
  JSONMessageTransport,
  JSONMessageTransportExchange,
} from '@ezreeport/rabbitmq';
import type { Logger } from '@ezreeport/logger';

export abstract class HeartbeatManager {
  protected logger: Logger;

  protected transport: Promise<
    JSONMessageTransport<JSONMessageTransportExchange>
  >;

  constructor(
    protected channel: rabbitmq.Channel,
    appLogger: Logger,
    protected mandatoryServices?: Map<string, boolean>
  ) {
    this.logger = appLogger.child({ scope: 'heartbeat' });

    this.transport = this.assertTransport();
  }

  private async assertTransport(): Promise<
    JSONMessageTransport<JSONMessageTransportExchange>
  > {
    try {
      const { exchange } = await this.channel.assertExchange(
        'ezreeport.heartbeat',
        'fanout',
        { durable: false }
      );

      if (this.mandatoryServices) {
        this.mandatoryServices.set('rabbitmq', true);
      }

      return {
        channel: this.channel,
        exchange: { name: exchange, routingKey: '' },
      };
    } catch (err) {
      this.logger.error({ msg: "Couldn't setup heartbeat", err });
      throw err;
    }
  }
}
