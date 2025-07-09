import chalk from 'chalk';

import { join } from 'node:path';

import { BaseCommand } from '../../lib/oclif/BaseCommand.js';
import { createTree } from '../../lib/tree.js';

export default class ProfileList extends BaseCommand<typeof ProfileList> {
  static description = 'List available profiles';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  public async run(): Promise<void> {
    await this.parse(ProfileList);

    const tree = createTree(this);
    for (const [name, configOrError] of this.ezraConfig.getPossibleProfiles()) {
      const profile = configOrError instanceof Error ? undefined : configOrError;
      const error = !profile ? configOrError : undefined;

      if (profile) {
        const subTree = createTree(this);

        subTree.insert(chalk.grey(`URL: ${chalk.underline(profile.url)}`));
        if (profile.priority) {
          subTree.insert(chalk.green(`Priority: ${chalk.bold(profile.priority)}`));
        }

        tree.insert(name, subTree);
      }

      if (error) {
        tree.insert(chalk.red(`${name}\t${chalk.bold(error as Error)}`));
      }
    }

    this.log(chalk.underline(join(this.ezraConfig.profilesDir)));
    tree.display();
  }
}
