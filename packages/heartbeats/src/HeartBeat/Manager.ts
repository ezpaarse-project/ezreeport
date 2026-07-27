import type { Logger } from '@ezreeport/logger';
import type {
  JSONMessageTransport,
  JSONMessageTransportExchange,
  rabbitmq,
} from '@ezreeport/rabbitmq';

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
    } catch (error) {
      this.logger.error({ err: error, msg: "Couldn't setup heartbeat" });
      throw error;
    }
  }
}
