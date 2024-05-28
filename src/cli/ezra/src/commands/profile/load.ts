import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ProfileLoad extends BaseCommand<typeof ProfileLoad> {
  static description = 'Load profile';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    priority: Flags.integer({
      char: 'p',
      description: 'Priority of profile. Higher priority profiles will be loaded first. Default to highest one',
    }),
  };

  static args = {
    name: Args.string({
      description: 'Profile name',
      required: true,
    }),
  };

  // eslint-disable-next-line class-methods-use-this
  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileLoad);

    const { profile, priority } = await this.ezraConfig.loadProfile(args.name, flags.priority);
    this.log(chalk.green(`Profile "${chalk.bold(args.name)}" (${chalk.underline(profile.path)}) loaded with priority "${chalk.bold(priority)}"`));
  }
}
