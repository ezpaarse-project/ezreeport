import { Args, Flags } from '@oclif/core';
import { lte as semverLte, compare as semverCompare } from 'semver';
import { format } from 'date-fns';
import chalk from 'chalk';
import ora from 'ora';

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { EzrCommand } from '../../lib/oclif/EzrCommand.js';
import { readJSONL, writeJSONL } from '../../lib/jsonl.js';

import migrations from '../../migrations/index.js';
import type { MigrationData } from '../../migrations/common.js';

export default class MigrateApply extends EzrCommand<typeof MigrateApply> {
  static description = 'Apply migrations to the instance, defaults to all migrations';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    file: Flags.file({
      char: 'f',
      description: 'Migration file to apply',
      exclusive: ['to'],
    }),
    to: Flags.string({
      description: 'Targeted version to migrate to',
      exclusive: ['file'],
    }),
    out: Flags.directory({
      char: 'o',
      description: 'Folder to output data',
      default: `data/${format(new Date(), 'yyyy-MM-dd')}_migrate`,
    }),
  };

  static args = {
    dir: Args.directory({
      required: true,
      exists: true,
      description: 'Exported data to read',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MigrateApply);

    const currentVersion = (await readFile(resolve(args.dir, 'version'), 'utf8')).trim();
    this.log(chalk.grey(`${chalk.blue('ℹ')} Version of ezREEPORT's data: ${chalk.bold(currentVersion)}`));

    if (!currentVersion) {
      throw new Error('Could not get current version');
    }

    const migrationsToApply = [];
    if (!flags.file) {
      // eslint-disable-next-line no-restricted-syntax
      for (const migration of Object.values(migrations)) {
        if (semverLte(migration.name, currentVersion)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (flags.to && !semverLte(migration.name, flags.to)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        migrationsToApply.push(migration);
      }
    } else {
      const { default: migration } = await import(resolve(flags.file));
      if (!semverLte(migration.name, currentVersion)) {
        migrationsToApply.push(migration);
      }
    }

    if (migrationsToApply.length <= 0) {
      this.log('No migrations to apply');
      return;
    }

    const getDataAction = ora(chalk.grey(`Getting data from ${chalk.underline(args.dir)}`)).start();
    let data: MigrationData = Object.fromEntries(
      await Promise.all([
        readJSONL(resolve(args.dir, 'namespaces.jsonl'))
          .then((namespaces) => ['namespaces', namespaces]),

        readJSONL(resolve(args.dir, 'templates.jsonl'))
          .then((templates) => ['templates', templates]),

        readJSONL(resolve(args.dir, 'tasks-presets.jsonl'))
          .then((tasksPresets) => ['taskPresets', tasksPresets]),

        readJSONL(resolve(args.dir, 'tasks.jsonl'))
          .then((tasks) => ['tasks', tasks]),
      ]),
    );
    getDataAction.succeed();
    this.log(chalk.grey(`    ${chalk.bold(`${data.namespaces.length} namespaces`)}`));
    this.log(chalk.grey(`    ${chalk.bold(`${data.templates.length} templates`)}`));
    this.log(chalk.grey(`    ${chalk.bold(`${data.taskPresets.length} task presets`)}`));
    this.log(chalk.grey(`    ${chalk.bold(`${data.tasks.length} tasks`)}`));

    const sortedMigrations = migrationsToApply.sort((a, b) => semverCompare(a.name, b.name));

    // eslint-disable-next-line no-restricted-syntax
    for (const migration of sortedMigrations) {
      const action = ora(chalk.blue(`Applying migration: ${chalk.bold(migration.name)}`)).start();
      try {
        // eslint-disable-next-line no-await-in-loop
        data = await migration.migrate(data, this.instances[0]);
      } catch (error) {
        action.fail(chalk.red((error as Error).message));
        throw error;
      }
      action.succeed();
    }

    const saveAction = ora(chalk.blue(`Saving data to ${chalk.underline(args.dir)}`)).start();
    await mkdir(flags.out, { recursive: true });

    writeJSONL(join(flags.out, 'namespaces.jsonl'), data.namespaces);
    writeJSONL(join(flags.out, 'templates.jsonl'), data.templates);
    writeJSONL(join(flags.out, 'tasks-presets.jsonl'), data.taskPresets);
    writeJSONL(join(flags.out, 'tasks.jsonl'), data.tasks);

    const lastVersion = sortedMigrations.at(-1).name;
    await writeFile(join(flags.out, 'version'), lastVersion);
    saveAction.succeed();

    this.log(chalk.green(`✔ Data from ${chalk.underline(args.dir)} migrated from ${chalk.bold(currentVersion)} to ${chalk.bold(lastVersion)} in ${chalk.underline(flags.out)}`));
  }
}
