import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';

import type { Duplex } from 'node:stream';
import { join } from 'node:path';

import { EzrCommand } from '../lib/oclif/EzrCommand.js';
import { simpleConfirm } from '../lib/inquirer.js';
import { createStreamPromise, createJSONLReadStream } from '../lib/streams.js';
import { createProgressBarStream } from '../lib/progress.js';

import type { EZR } from '../lib/ezr/index.js';
import { createNamespacesWriteStream } from '../lib/ezr/namespaces.js';
import { createTemplatesWriteStream } from '../lib/ezr/templates.js';
import { createTaskPresetsWriteStream } from '../lib/ezr/tasksPresets.js';
import { createTasksWriteStream } from '../lib/ezr/tasks.js';

export default class Import extends EzrCommand<typeof Import> {
  static description = 'Import instance data from a dedicated folder';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    namespaces: Flags.boolean({
      description: 'Import namespaces',
      allowNo: true,
      default: true,
    }),
    templates: Flags.boolean({
      description: 'Import templates',
      allowNo: true,
      default: true,
    }),
    tasks: Flags.boolean({
      description: 'Import tasks',
      allowNo: true,
      default: true,
    }),
    taskPresets: Flags.boolean({
      description: 'Import task presets',
      allowNo: true,
      default: true,
    }),
  };

  static args = {
    dir: Args.directory({
      required: true,
      exists: true,
      description: 'Exported data to read',
    }),
  };

  private async importData(opts: {
    type: string,
    createDataWriteStream: (ezr: EZR) => { stream: Duplex },
    inFile: string,
  }) {
    try {
      this.log(chalk.blue(`Restoring ${opts.type}...`));

      const { stream } = opts.createDataWriteStream(this.instances[0]);
      const { total, progress } = createProgressBarStream({
        onEnd: (c) => this.log(chalk.green(`${c} ${opts.type} backed up`)),
      });

      await createStreamPromise(
        createJSONLReadStream(opts.inFile)
          .pipe(total)
          .pipe(stream)
          .pipe(progress),
      );
    } catch (error) {
      this.logToStderr(chalk.red((error as Error).message));
    }
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Import);
    const confirmed = await simpleConfirm(`Do you wish to import data from ${chalk.underline(args.dir)} into ${chalk.underline(this.instances[0].fetch.defaults.baseURL ?? '')} ?`);
    if (!confirmed) {
      this.exit(0);
    }

    if (flags.namespaces) {
      await this.importData({
        type: 'namespaces',
        createDataWriteStream: createNamespacesWriteStream,
        inFile: join(args.dir, 'namespaces.jsonl'),
      });
    }

    if (flags.templates) {
      await this.importData({
        type: 'templates',
        createDataWriteStream: createTemplatesWriteStream,
        inFile: join(args.dir, 'templates.jsonl'),
      });
    }

    if (flags.taskPresets) {
      await this.importData({
        type: 'tasks presets',
        createDataWriteStream: createTaskPresetsWriteStream,
        inFile: join(args.dir, 'tasks-presets.jsonl'),
      });
    }

    if (flags.tasks) {
      await this.importData({
        type: 'tasks',
        createDataWriteStream: createTasksWriteStream,
        inFile: join(args.dir, 'tasks.jsonl'),
      });
    }
  }
}
