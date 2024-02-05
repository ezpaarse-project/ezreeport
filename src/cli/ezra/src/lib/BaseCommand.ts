import { Command, ux, type Config } from '@oclif/core';
import { EZR } from './ezr/index.js';

export abstract class BaseCommand extends Command {
  /**
    @internal
  */
  public ezr: EZR;

  constructor(argv: string[], config: Config) {
    super(argv, config);
    this.ezr = new EZR();
  }

  public async init(): Promise<void> {
    await super.init();

    ux.action.start(
      ux.colorize('grey', 'Connecting to ezREEPORT'),
    );
    await this.ezr.init({
      url: process.env.API_URL,
      apiKey: process.env.API_KEY,
      admin: process.env.API_ADMIN,
    });
    ux.action.stop(
      ux.colorize('grey', 'OK'),
    );
  }
}
