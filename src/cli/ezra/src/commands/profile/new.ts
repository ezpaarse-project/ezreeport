import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';

import { EZR } from '../../lib/ezr/index.js';
import { readJSON } from '../../lib/json.js';
import { BaseCommand } from '../../lib/oclif/BaseCommand.js';

export default class ProfileNew extends BaseCommand<typeof ProfileNew> {
  static description = 'Create a new profile';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    file: Flags.file({
      char: 'f',
      exists: true,
      description: 'Read config from a file',
      allowStdin: true,
    }),

    load: Flags.boolean({
      description: 'Load the profile after creating it',
    }),
    priority: Flags.integer({
      relationships: [
        { type: 'all', flags: ['load'] },
      ],
      description: 'Priority when loading the profile. If not set, it will be the highest priority',
    }),

    url: Flags.string({
      description: 'ezREEPORT API URL',
    }),
    admin: Flags.string({
      description: 'ezREEPORT administrator username',
    }),
  };

  static args = {
    name: Args.string({ description: 'Profile name', required: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileNew);

    if (!args.name) {
      throw new Error('Profile name is required');
    }

    if (this.ezraConfig.getPossibleProfiles().get(args.name)) {
      throw new Error(`Profile "${args.name}" already exists`);
    }

    let config: Record<string, any> = {};
    if (flags.file) {
      try {
        config = await readJSON(flags.file);
      } catch (error) {
        throw new Error(`Failed to read config from ${flags.file}`);
      }
    }

    // Setup ezr vars
    config.url = flags.url || config.url;
    config.admin = flags.admin || config.admin;

    const ezr = new EZR(this);
    const inputs = await ezr.init({
      url: config.url,
      apiKey: config.key,
      admin: config.admin,
    });

    config.url = inputs.url;
    config.key = inputs.apiKey;
    config.admin = inputs.admin;

    await this.ezraConfig.upsertProfile(args.name, config);
    this.log(chalk.green(`Profile "${chalk.bold(args.name)}" created`));

    if (flags.load) {
      const { priority, profile } = await this.ezraConfig.loadProfile(args.name, flags.priority);
      this.log(chalk.green(`Profile "${chalk.bold(args.name)}" (${chalk.underline(profile.path)}) loaded with priority "${chalk.bold(priority)}"`));
    }
  }
}
