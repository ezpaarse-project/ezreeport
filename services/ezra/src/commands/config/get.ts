import { Args, Flags } from '@oclif/core';
import lodash from 'lodash';
import chalk from 'chalk';

import { type InspectOptions, inspect } from 'node:util';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ConfigGet extends BaseCommand<typeof ConfigGet> {
  static description = 'Show configs & profiles loaded';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile name',
    }),
    main: Flags.boolean({
      allowNo: true,
      description: 'Show main config',
      default: true,
    }),
  };

  static args = {
    field: Args.string({ description: 'Field to show. Allow dot notation' }),
  };

  private inspectConfig: InspectOptions = {
    depth: 5,
    colors: true,
    compact: false,
  };

  private showMain(field?: string) {
    const config = field ? lodash.pick(this.ezraConfig.config, [field]) : this.ezraConfig.config;
    if (Object.keys(config).length <= 0) {
      return;
    }

    this.log(chalk.grey(this.ezraConfig.configPath));
    this.log(inspect(config, this.inspectConfig));
  }

  private showProfile(name: string, field?: string) {
    const {
      path,
      priority,
      name: _,
      ...profile
    } = this.ezraConfig.getProfile(name);

    const config = field ? lodash.pick(profile, [field]) : profile;
    if (Object.keys(config).length <= 0) {
      return;
    }

    this.log(chalk.grey(path));
    if (priority) {
      this.log(chalk.green(`Priority: ${priority}`));
    }
    this.log(inspect(config, this.inspectConfig));
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigGet);

    if (flags.main) {
      this.showMain(args.field);
    }

    const profiles = flags.profile ? [[flags.profile]] : this.ezraConfig.getLoadedProfiles();

    for (const [name] of profiles) {
      this.showProfile(name, args.field);
    }
  }
}
