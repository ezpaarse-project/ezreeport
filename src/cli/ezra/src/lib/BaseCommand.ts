import { Command } from '@oclif/core';
import * as ezr from './ezr/index.js';

export abstract class BaseCommand extends Command {
  public async init(): Promise<void> {
    await super.init();
    await ezr.setup({
      url: process.env.API_URL,
      apiKey: process.env.API_KEY,
      admin: process.env.API_ADMIN,
    });
  }
}
