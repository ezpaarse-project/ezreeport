import { Args, Flags, ux } from '@oclif/core';
import chalk from 'chalk';

import type { Duplex } from 'node:stream';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { BaseCommand } from '../lib/BaseCommand.js';
import { createStreamPromise, createJSONLReadStream } from '../lib/streams.js';
import type { EZR } from '../lib/ezr/index.js';
import { createNamespacesWriteStream } from '../lib/ezr/namespaces.js';
import { createTemplatesWriteStream } from '../lib/ezr/templates.js';
import { createTaskPresetsWriteStream } from '../lib/ezr/tasksPresets.js';
import { createTasksWriteStream } from '../lib/ezr/tasks.js';
import { createProgressBarStream } from '../lib/progress.js';

export default class Restore extends BaseCommand {
  static description = 'Restore instance data from a dedicated folder';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    namespaces: Flags.boolean({
      description: 'Restore namespaces',
      allowNo: true,
      default: true,
    }),
    templates: Flags.boolean({
      description: 'Restore templates',
      allowNo: true,
      default: true,
    }),
    tasks: Flags.boolean({
      description: 'Restore tasks',
      allowNo: true,
      default: true,
    }),
    taskPresets: Flags.boolean({
      description: 'Restore task presets',
      allowNo: true,
      default: true,
    }),
  };

  static args = {
    dir: Args.string({ description: 'exported data to read' }),
  };

  private async restoreData(opts: {
    type: string,
    createDataWriteStream: (ezr: EZR) => { stream: Duplex },
    inFile: string,
  }) {
    try {
      this.log(ux.colorize('blue', `Restoring ${opts.type}...`));

      const { stream } = opts.createDataWriteStream(this.ezr);
      const { total, progress } = createProgressBarStream({
        onEnd: (c) => this.log(ux.colorize('green', `${c} ${opts.type} backed up`)),
      });

      await createStreamPromise(
        createJSONLReadStream(opts.inFile)
          .pipe(total)
          .pipe(stream)
          .pipe(progress),
      );
    } catch (error) {
      this.logToStderr(
        ux.colorize('red', (error as Error).message),
      );
    }
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Restore);

    const dir = args.dir || '';
    let isDir;
    try {
      isDir = (await stat(dir)).isDirectory();
    } catch (error) {
      isDir = false;
    }

    if (!isDir) {
      this.logToStderr(
        ux.colorize('red', `${dir} is not a directory`),
      );
      this.exit(1);
    }

    const confirmed = await ux.confirm(`Do you wish to import data from ${chalk.underline(dir)} into ${chalk.underline(this.ezr.fetch.defaults.baseURL ?? '')} ?`);
    if (!confirmed) {
      this.exit(0);
    }

    if (flags.namespaces) {
      await this.restoreData({
        type: 'namespaces',
        createDataWriteStream: createNamespacesWriteStream,
        inFile: join(dir, 'namespaces.jsonl'),
      });
    }

    if (flags.templates) {
      await this.restoreData({
        type: 'templates',
        createDataWriteStream: createTemplatesWriteStream,
        inFile: join(dir, 'templates.jsonl'),
      });
    }

    if (flags.taskPresets) {
      await this.restoreData({
        type: 'tasks presets',
        createDataWriteStream: createTaskPresetsWriteStream,
        inFile: join(dir, 'tasks-presets.jsonl'),
      });
    }

    if (flags.tasks) {
      await this.restoreData({
        type: 'tasks',
        createDataWriteStream: createTasksWriteStream,
        inFile: join(dir, 'tasks.jsonl'),
      });
    }
  }
}
