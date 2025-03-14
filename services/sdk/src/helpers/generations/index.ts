import createEventfulPromise, { type EventfulPromise } from '~/lib/promises';
import { setTimeoutAsync } from '~/lib/utils';

import { assignDependencies } from '~/helpers/permissions/decorator';

import { generateReportOfTask, getFileAsJson } from '~/modules/reports/methods';
import type { ReportResult } from '~/modules/reports/types';
import { getTask } from '~/modules/tasks/methods';
import type { Task } from '~/modules/tasks/types';
import type { Generation, GenerationStatus } from '~/modules/generations/types';
import { getGeneration } from '~/modules/generations/methods';

export type GenerationStartedEvent = { id: string };

export type GenerationProgressEvent = Generation;

type GenerationEvents = {
  'started': [GenerationStartedEvent],
  'progress': [GenerationProgressEvent],
};

/**
 * Start generation of a report and track progress
 *
 * @param taskOrId Task or Task's id
 * @param targets Override targets, also enable first level of debugging
 * @param period Override period, must match task's recurrence
 *
 * @fires #started When generation started. See `GenerationStartedEvent`.
 * @fires #progress When generation progress. See `GenerationProgressEvent`. Job's progress is
 * between 0 and 1
 *
 * @throws If job's fails. **Not if generation fails !**
 *
 * @returns When the report is ready, returns the report result
 */
// eslint-disable-next-line import/prefer-default-export
export function generateAndListenReportOfTask(
  taskOrId: Omit<Task, 'template'> | string,
  period?: { start: Date, end: Date },
  targets?: string[],
  polling?: { pending?: number, active?: number } | number,
): EventfulPromise<ReportResult, GenerationEvents> {
  const endStatuses = new Set<GenerationStatus | ''>(['SUCCESS', 'ERROR']);

  const sleepDurations = {
    pending: typeof polling === 'number' ? polling : polling?.pending ?? 1000,
    active: typeof polling === 'number' ? polling : polling?.active ?? 1000,
  };

  return createEventfulPromise<ReportResult, GenerationEvents>(
    async (events) => {
      const { id } = await generateReportOfTask(taskOrId, period, targets);
      events.emit('started', { id });

      let last: Generation | undefined;

      /* eslint-disable no-await-in-loop */
      while (!endStatuses.has(last?.status ?? '')) {
        const generation = await getGeneration(id);

        last = generation;
        events.emit('progress', generation);

        let sleepDuration = sleepDurations.pending;
        if (last?.status === 'PROCESSING') {
          sleepDuration = sleepDurations.active;
        }
        await setTimeoutAsync(sleepDuration);
      }
      /* eslint-enable no-await-in-loop */

      if (!last) {
        throw new Error('Generation not found');
      }

      return getFileAsJson(taskOrId, `${last.reportId}.det.json`);
    },
  );
}
assignDependencies(
  generateAndListenReportOfTask,
  [getTask, generateReportOfTask, getGeneration, getFileAsJson],
);
