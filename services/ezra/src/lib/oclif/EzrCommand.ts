import { Config, type Command } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from './BaseCommand.js';

import { EZR } from '../ezr/index.js';

export abstract class EzrCommand<T extends typeof Command> extends BaseCommand<T> {
  protected instances: EZR[] = [];

  constructor(argv: string[], config: Config, instanceCount = 1) {
    super(argv, config);

    for (let i = 0; i < instanceCount; i += 1) {
      this.instances.push(new EZR(this));
    }
  }

  public async init(): Promise<void> {
    await super.init();

    for (let i = 0; i < this.instances.length; i += 1) {
      const ezr = this.instances[i];

      this.log(chalk.grey(`  Connecting to ezREEPORT #${i}...`));

      const config = this.ezraConfig.getProfileAt(i) || {};

      const inputs = await ezr.init({
        url: config.url,
        apiKey: config.key,
        admin: config.admin,
      });

      this.log(chalk.grey(`${chalk.green('✔')} Connected to ${chalk.underline(inputs.url)}`));
    }
  }
}
