import { Flags, ux } from '@oclif/core';
import { format } from 'date-fns';

import type { Readable } from 'node:stream';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

import { BaseCommand } from '../lib/BaseCommand.js';
import { createJSONLWriteStream, createStreamPromise } from '../lib/streams.js';
import { createNamespacesReadStream } from '../lib/ezr/namespaces.js';
import { createTemplatesReadStream } from '../lib/ezr/templates.js';
import { createTaskPresetsReadStream } from '../lib/ezr/tasksPresets.js';
import { createTasksReadStream } from '../lib/ezr/tasks.js';

export default class Backup extends BaseCommand {
  static description = 'Backup instance data into a dedicated folder';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    out: Flags.string({
      char: 'o',
      description: 'Folder to output data',
      default: `data/${format(new Date(), 'yyyy-MM-dd')}_backup`,
    }),
    namespaces: Flags.boolean({
      description: 'Backup namespaces',
      allowNo: true,
      default: true,
    }),
    templates: Flags.boolean({
      description: 'Backup templates',
      allowNo: true,
      default: true,
    }),
    tasks: Flags.boolean({
      description: 'Backup tasks',
      allowNo: true,
      default: true,
    }),
    taskPresets: Flags.boolean({
      description: 'Backup task presets',
      allowNo: true,
      default: true,
    }),
  };

  private async backupData(opts: {
    createDataReadStream: () => Promise<Readable>,
    outFile: string,
  }) {
    try {
      await createStreamPromise(
        (await opts.createDataReadStream())
          .pipe(createJSONLWriteStream(opts.outFile)),
      );
    } catch (error) {
      this.logToStderr(
        ux.colorize('red', (error as Error).message),
      );
    }
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Backup);

    await mkdir(flags.out, { recursive: true });

    if (flags.namespaces) {
      await this.backupData({
        createDataReadStream: createNamespacesReadStream,
        outFile: join(flags.out, 'namespaces.jsonl'),
      });
    }

    if (flags.templates) {
      await this.backupData({
        createDataReadStream: createTemplatesReadStream,
        outFile: join(flags.out, 'templates.jsonl'),
      });
    }

    if (flags.tasks) {
      await this.backupData({
        createDataReadStream: createTasksReadStream,
        outFile: join(flags.out, 'tasks.jsonl'),
      });
    }

    if (flags.taskPresets) {
      await this.backupData({
        createDataReadStream: createTaskPresetsReadStream,
        outFile: join(flags.out, 'tasks-presets.jsonl'),
      });
    }
  }
}
