import { Flags } from '@oclif/core';
import {
  lt as semverLt,
  eq as semverEq,
  gt as semverGt,
  compare as semverCompare,
} from 'semver';
import chalk from 'chalk';
import ora from 'ora';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { EzrCommand } from '../../lib/oclif/EzrCommand.js';
import { createTree } from '../../lib/tree.js';

import migrations from '../../migrations/index.js';

export default class MigrateList extends EzrCommand<typeof MigrateList> {
  static description = 'List migrations available for instance or a data directory';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    dir: Flags.directory({
      char: 'd',
      exists: true,
      description: 'Exported data to read',
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'List all migrations',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MigrateList);

    const action = ora(chalk.gray('Getting current version...')).start();
    let currentVersion;
    try {
      if (flags.dir) {
        currentVersion = (await readFile(resolve(flags.dir, 'version'), 'utf8')).trim();
      } else {
        const { data } = await this.instances[0].fetch('/health/');
        currentVersion = data.content.currentVersion;
      }
    } catch (error) {
      action.fail(chalk.red((error as Error).message));
      throw error;
    }
    action.info(chalk.gray(`Current version: ${currentVersion}`));

    if (!currentVersion) {
      throw new Error('Could not get current version');
    }

    const versionsAvailable = Object.keys(migrations).sort(semverCompare);

    const tree = createTree(this);
    for (const name of versionsAvailable) {
      if (semverGt(currentVersion, name) && flags.all) {
        tree.insert(chalk.grey(`${name} ${chalk.italic('(previous version)')}`));
      }
      if (semverEq(currentVersion, name)) {
        tree.insert(chalk.green(`${name} ${chalk.italic('(current version)')}`));
      }
      if (semverLt(currentVersion, name)) {
        tree.insert(name);
      }
    }

    const optionsCount = Object.keys(tree.nodes).length;
    if (optionsCount > 0) {
      this.log('Available migrations:');
      tree.display();
    } else {
      this.log(`No migrations available for this ${flags.dir ? 'data' : 'instance'}`);
    }
  }
}
