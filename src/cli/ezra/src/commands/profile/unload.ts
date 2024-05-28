import { Args } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ProfileUnload extends BaseCommand<typeof ProfileUnload> {
  static description = 'Unload profile';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static args = {
    name: Args.string({
      description: 'Profile name',
      required: true,
    }),
  };

  // eslint-disable-next-line class-methods-use-this
  public async run(): Promise<void> {
    const { args } = await this.parse(ProfileUnload);

    await this.ezraConfig.unloadProfile(args.name);
    this.log(chalk.green(`Profile "${chalk.bold(args.name)}" unloaded`));
  }
}
