import { client } from '~/lib/fetch';
import createEventfulPromise, { type EventfulPromise } from '~/lib/promises';

import { assignDependencies, assignPermission } from '~/helpers/permissions/decorator';

import { generateReportOfTask, getFileAsJson } from '~/modules/reports/methods';
import type { ReportResult } from '~/modules/reports/types';
import { getTask } from '~/modules/tasks/methods';
import type { Task } from '~/modules/tasks/types';
import { transformGeneration } from '~/modules/generations/methods';
import type { GenerationStatus, Generation, RawGeneration } from '~/modules/generations/types';

export type GenerationStartedEvent = { id: string };

export type GenerationProgressEvent = Omit<Generation, 'task'>;

type GenerationEvents = {
  'started': [GenerationStartedEvent],
  'progress': [GenerationProgressEvent],
};

const GEN_END_STATES = new Set<GenerationStatus>(['SUCCESS', 'ERROR', 'ABORTED']);

export const isGenerationEnded = (g: Generation): boolean => GEN_END_STATES.has(g.status);

type ReportGenerationPromise = EventfulPromise<ReportResult, GenerationEvents>;

/**
 * Start generation of a report and track progress
 *
 * @param taskOrId Task or Task's id
 * @param targets Override targets, also enable first level of debugging
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
export const generateAndListenReportOfTask = (
  taskOrId: Omit<Task, 'template'> | string,
  period?: { start: Date, end: Date },
  targets?: string[],
): ReportGenerationPromise => createEventfulPromise<ReportResult, GenerationEvents>(
  async (events, resolve) => {
    const task = await getTask(taskOrId);
    const websocket = client.socket('/generations', [task.namespaceId]);
    if (!websocket) {
      throw new Error('Unable to get socket');
    }

    websocket.on('generation:updated', function onGenerationUpdated(g: Omit<RawGeneration, 'task'>) {
      const generation: Omit<Generation, 'task'> = transformGeneration(g);
      // Notify progress if it's the correct task
      if (generation.taskId !== task.id) {
        return;
      }
      events.emit('progress', generation);

      // If generation ended, stop listening
      if (!isGenerationEnded(generation)) {
        return;
      }
      websocket.off('generation:updated', onGenerationUpdated);

      // And resolve result
      getFileAsJson(taskOrId, `${generation.reportId}.det.json`)
        .then((result) => resolve(result));
    });

    // Once events are registered, start generation
    const { id } = await generateReportOfTask(taskOrId, period, targets);
    events.emit('started', { id });
  },
);
assignDependencies(
  generateAndListenReportOfTask,
  [getTask, generateReportOfTask, getFileAsJson],
);

/**
 * Listen to all generations
 *
 * @param onUpdate Function to call when a generation is updated
 * @param namespaces Namespaces to listen to
 *
 * @returns Function to remove listener
 */
export function listenAllGenerations(
  onUpdate: (generation: Omit<Generation, 'task'>) => void,
  namespaces?: string[],
) {
  const websocket = client.socket('/generations', namespaces);
  if (!websocket) {
    throw new Error('Unable to get socket');
  }

  const updated = (g: Omit<RawGeneration, 'task'>) => onUpdate(transformGeneration(g));

  websocket.on('generation:updated', updated);

  return {
    stop: () => {
      websocket.off('generation:updated', updated);
    },
  };
}
// Applies same permissions as `GET /generations/:id`
assignPermission(listenAllGenerations, 'GET /generations/:id', true);
