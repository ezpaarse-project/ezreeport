import { Args } from '@oclif/core';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ProfileDelete extends BaseCommand<typeof ProfileDelete> {
  static description = 'Delete profile and unload it if needed';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static args = {
    name: Args.string({ description: 'Profile name', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ProfileDelete);

    if (!args.name) {
      throw new Error('Profile name is required');
    }

    await this.ezraConfig.deleteProfile(args.name);
    this.log(chalk.green(`Profile "${chalk.bold(args.name)}" deleted`));
  }
}
