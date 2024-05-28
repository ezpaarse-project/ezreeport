import { Args, Flags } from '@oclif/core';
import { format } from 'date-fns';
import chalk from 'chalk';
import ora from 'ora';

import type { Readable } from 'node:stream';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import { EzrCommand } from '../lib/oclif/EzrCommand.js';
import { createJSONLWriteStream, createStreamPromise } from '../lib/streams.js';
import { createProgressBarStream } from '../lib/progress.js';

import type { EZR } from '../lib/ezr/index.js';
import { createNamespacesReadStream } from '../lib/ezr/namespaces.js';
import { createTemplatesReadStream } from '../lib/ezr/templates.js';
import { createTaskPresetsReadStream } from '../lib/ezr/tasksPresets.js';
import { createTasksReadStream } from '../lib/ezr/tasks.js';

export default class Export extends EzrCommand<typeof Export> {
  static description = 'Export instance data into a dedicated folder';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    out: Flags.directory({
      char: 'o',
      description: 'Folder to output data',
      default: `data/${format(new Date(), 'yyyy-MM-dd')}_export`,
    }),
    namespaces: Flags.boolean({
      description: 'Export namespaces',
      allowNo: true,
      default: true,
    }),
    templates: Flags.boolean({
      description: 'Export templates',
      allowNo: true,
      default: true,
    }),
    tasks: Flags.boolean({
      description: 'Export tasks',
      allowNo: true,
      default: true,
    }),
    taskPresets: Flags.boolean({
      description: 'Export task presets',
      allowNo: true,
      default: true,
    }),
  };

  static args = {
    dir: Args.directory({
      description: 'Folder to output data',
      default: `data/${format(new Date(), 'yyyy-MM-dd')}_export`,
    }),
  };

  private async exportData(opts: {
    type: string,
    createDataReadStream: (ezr: EZR) => Promise<{ count: number, stream: Readable }>,
    outFile: string,
  }) {
    try {
      this.log(chalk.blue(`Backing ${chalk.bold(opts.type)}...`));

      const { count, stream } = await opts.createDataReadStream(this.instances[0]);
      const { progress } = createProgressBarStream({
        total: count,
        onEnd: (c) => this.log(chalk.green(`${chalk.bold(c)} ${chalk.bold(opts.type)} backed up`)),
      });

      await createStreamPromise(
        stream
          .pipe(createJSONLWriteStream(opts.outFile))
          .pipe(progress),
      );
    } catch (error) {
      this.logToStderr(chalk.red((error as Error).message));
    }
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Export);

    const action = ora(chalk.gray('Getting current version...')).start();
    let currentVersion;
    try {
      const { data } = await this.instances[0].fetch('/health/');
      currentVersion = data.content.currentVersion;
    } catch (error) {
      action.fail(chalk.red((error as Error).message));
      throw error;
    }
    action.info(chalk.gray(`Current version: ${currentVersion}`));

    await mkdir(args.dir, { recursive: true });
    await writeFile(join(args.dir, 'version'), currentVersion);

    if (flags.namespaces) {
      await this.exportData({
        type: 'namespaces',
        createDataReadStream: createNamespacesReadStream,
        outFile: join(args.dir, 'namespaces.jsonl'),
      });
    }

    if (flags.templates) {
      await this.exportData({
        type: 'templates',
        createDataReadStream: createTemplatesReadStream,
        outFile: join(args.dir, 'templates.jsonl'),
      });
    }

    if (flags.taskPresets) {
      await this.exportData({
        type: 'tasks presets',
        createDataReadStream: createTaskPresetsReadStream,
        outFile: join(args.dir, 'tasks-presets.jsonl'),
      });
    }

    if (flags.tasks) {
      await this.exportData({
        type: 'tasks',
        createDataReadStream: createTasksReadStream,
        outFile: join(args.dir, 'tasks.jsonl'),
      });
    }
  }
}
