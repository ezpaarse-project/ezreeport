import { Flags, Config } from '@oclif/core';
import chalk from 'chalk';

import type { Readable, Duplex } from 'node:stream';

import { EzrCommand } from '../lib/oclif/EzrCommand.js';
import { simpleConfirm } from '../lib/inquirer.js';
import { createStreamPromise } from '../lib/streams.js';
import { createProgressBarStream } from '../lib/progress.js';

import type { EZR } from '../lib/ezr/index.js';
import { createNamespacesReadStream, createNamespacesWriteStream } from '../lib/ezr/namespaces.js';
import { createTemplatesReadStream, createTemplatesWriteStream } from '../lib/ezr/templates.js';
import { createTaskPresetsReadStream, createTaskPresetsWriteStream } from '../lib/ezr/tasksPresets.js';
import { createTasksReadStream, createTasksWriteStream } from '../lib/ezr/tasks.js';

export default class Transfer extends EzrCommand<typeof Transfer> {
  static description = 'Transfer instance data to a dedicated folder';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    namespaces: Flags.boolean({
      description: 'Transfer namespaces',
      allowNo: true,
      default: true,
    }),
    templates: Flags.boolean({
      description: 'Transfer templates',
      allowNo: true,
      default: true,
    }),
    tasks: Flags.boolean({
      description: 'Transfer tasks',
      allowNo: true,
      default: true,
    }),
    taskPresets: Flags.boolean({
      description: 'Transfer task presets',
      allowNo: true,
      default: true,
    }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config, 2);
  }

  private async transferData(opts: {
    type: string,
    createDataReadStream: (ezr: EZR) => Promise<{ count: number, stream: Readable }>,
    createDataWriteStream: (ezr: EZR) => { stream: Duplex },
  }) {
    try {
      this.log(chalk.blue(`Transferring ${opts.type}...`));

      const [src, dst] = this.instances;
      const { count, stream: inStream } = await opts.createDataReadStream(src);
      const { stream: outStream } = opts.createDataWriteStream(dst);
      const { progress } = createProgressBarStream({
        total: count,
        onEnd: (c) => this.log(chalk.green(`${c} ${opts.type} transferred`)),
      });

      await createStreamPromise(
        inStream
          .pipe(outStream)
          .pipe(progress),
      );
    } catch (error) {
      this.logToStderr(chalk.red((error as Error).message));
    }
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Transfer);

    const [src, dst] = this.instances;
    const confirmed = await simpleConfirm(`Do you wish to import data from ${chalk.underline(src.fetch.defaults.baseURL)} into ${chalk.underline(dst.fetch.defaults.baseURL)} ?`);
    if (!confirmed) {
      this.exit(0);
    }

    if (flags.namespaces) {
      await this.transferData({
        type: 'namespaces',
        createDataReadStream: createNamespacesReadStream,
        createDataWriteStream: createNamespacesWriteStream,
      });
    }

    if (flags.templates) {
      await this.transferData({
        type: 'templates',
        createDataReadStream: createTemplatesReadStream,
        createDataWriteStream: createTemplatesWriteStream,
      });
    }

    if (flags.taskPresets) {
      await this.transferData({
        type: 'tasks presets',
        createDataReadStream: createTaskPresetsReadStream,
        createDataWriteStream: createTaskPresetsWriteStream,
      });
    }

    if (flags.tasks) {
      await this.transferData({
        type: 'tasks',
        createDataReadStream: createTasksReadStream,
        createDataWriteStream: createTasksWriteStream,
      });
    }
  }
}
