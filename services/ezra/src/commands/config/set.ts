import { Args, Flags } from '@oclif/core';
import lodash from 'lodash';
import chalk from 'chalk';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ConfigSet extends BaseCommand<typeof ConfigSet> {
  static description = 'describe the command here';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile to set config for',
    }),
  };

  static args = {
    key: Args.string({
      required: true,
    }),
    value: Args.string({
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigSet);

    let { config } = this.ezraConfig;
    if (flags.profile) {
      config = this.ezraConfig.getProfile(flags.profile);
    }

    lodash.set(config, args.key, args.value);

    if (flags.profile) {
      await this.ezraConfig.upsertProfile(flags.profile, config);
      this.log(
        chalk.green(`Updated "${chalk.bold(flags.profile)}"`),
      );
      return;
    }

    await this.ezraConfig.update(config);
    this.log(
      chalk.green(`Updated main config (${chalk.underline(this.ezraConfig.configPath)})`),
    );
  }
}
