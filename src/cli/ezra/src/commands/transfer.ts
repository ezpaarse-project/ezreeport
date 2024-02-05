import { Flags, ux, Config } from '@oclif/core';

import type { Readable, Duplex } from 'node:stream';

import { BaseCommand } from '../lib/BaseCommand.js';
import { createStreamPromise } from '../lib/streams.js';
import { EZR } from '../lib/ezr/index.js';
import { createNamespacesReadStream, createNamespacesWriteStream } from '../lib/ezr/namespaces.js';
import { createTemplatesReadStream, createTemplatesWriteStream } from '../lib/ezr/templates.js';
import { createTaskPresetsReadStream, createTaskPresetsWriteStream } from '../lib/ezr/tasksPresets.js';
import { createTasksReadStream, createTasksWriteStream } from '../lib/ezr/tasks.js';
import { createProgressBarStream } from '../lib/progress.js';

export default class Transfer extends BaseCommand {
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

  private dstEZR: EZR;

  constructor(argv: string[], config: Config) {
    super(argv, config);
    this.dstEZR = new EZR();
  }

  private async transferData(opts: {
    type: string,
    createDataReadStream: (ezr: EZR) => Promise<{ count: number, stream: Readable }>,
    createDataWriteStream: (ezr: EZR) => { stream: Duplex },
  }) {
    try {
      this.log(ux.colorize('blue', `Transferring ${opts.type}...`));

      const { count, stream: inStream } = await opts.createDataReadStream(this.ezr);
      const { stream: outStream } = opts.createDataWriteStream(this.dstEZR);
      const { progress } = createProgressBarStream({
        total: count,
        onEnd: (c) => this.log(ux.colorize('green', `${c} ${opts.type} transferred`)),
      });

      await createStreamPromise(
        inStream
          .pipe(outStream)
          .pipe(progress),
      );
    } catch (error) {
      this.logToStderr(
        ux.colorize('red', (error as Error).message),
      );
    }
  }

  public async init(): Promise<void> {
    await super.init();

    ux.action.start(
      ux.colorize('grey', 'Connecting to destination'),
    );
    await this.dstEZR.init({
      url: process.env.DST_API_URL,
      apiKey: process.env.DST_API_KEY,
      admin: process.env.DST_API_ADMIN,
    });
    ux.action.stop(
      ux.colorize('grey', 'OK'),
    );
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Transfer);

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
