import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

import { glob } from 'glob';

import config from '~/lib/config';

import type { ReportFilesType, ReportFilesOfTaskType } from './types';

const { reportDir } = config;

/**
 * Scan reportDir to get the reports per tasks
 *
 * @returns The reports per tasks
 */
export async function getReportsPerTasks() {
  const files = await glob('**/*.{json,pdf}', { cwd: reportDir });

  const pathsPerTask = new Map<string, string>();
  const filesPerPath = new Map<string, ReportFilesType>();

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files.sort()) {
    const [name, fileType] = file.split('.');
    let type: keyof ReportFilesType;
    switch (fileType) {
      case 'det': {
        type = 'detail';
        // eslint-disable-next-line no-await-in-loop
        const { detail } = JSON.parse(await readFile(join(reportDir, file), 'utf-8'));
        pathsPerTask.set(name, detail.taskId);
        break;
      }
      case 'deb':
        type = 'debug';
        break;
      case 'rep':
        type = 'report';
        break;

      default:
        // eslint-disable-next-line no-continue
        continue;
    }

    const current = filesPerPath.get(name) ?? {} as ReportFilesType;
    current[type] = file;
    filesPerPath.set(name, current);
  }

  const aggregation: Record<string, ReportFilesOfTaskType> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [name, taskId] of pathsPerTask) {
    const current = aggregation[taskId] ?? {};
    current[name] = filesPerPath.get(name) ?? {} as ReportFilesType;
    aggregation[taskId] = current;
  }

  return aggregation;
}

/**
 * Shorthand to get the reports of a task
 *
 * @param taskId The task id
 *
 * @returns The reports
 */
export async function getReportsOfTask(taskId: string): Promise<ReportFilesOfTaskType | undefined> {
  const aggregation = await getReportsPerTasks();
  return aggregation[taskId];
}
