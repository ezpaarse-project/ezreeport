import EventEmitter from 'events';
import axios from '../lib/axios';
import { sleep } from '../lib/utils';
import { FullJob, getJob, Job } from './queue';

// interface ReportResult {
//   success: boolean,
//   detail: {
//     createdAt: string, // Date
//     destroyAt: string, // Date
//     took: number,
//     taskId: string,
//     files: {
//       detail: string,
//       report?: string,
//       debug?: string,
//     },
//     sendingTo?: string[],
//     period?: {
//       start: string, // Date
//       end: string, // Date
//     },
//     runAs?: string,
//     stats?: object,
//     error?: {
//       message: string,
//       stack: string[]
//     },
//     meta?: unknown
//   }
// }

// data: {
//   task: any, // Task
//   origin: string,
//   writeHistory?: boolean,
//   customPeriod?: { start: string, end: string },
//   debug?: boolean
// }
export const startGeneration = (
  taskId: string,
  params?: {
    testEmails?: string[],
    period?: { start: string, end: string },
    institutionId?: string,
  },
) => axios.$post<Job<object>>(
  `/tasks/${taskId}/run`,
  null,
  {
    params: {
      test_emails: params?.testEmails,
      period_start: params?.period?.start,
      period_end: params?.period?.end,
      institution: params?.institutionId,
    },
  },
);

export const listenGeneration = async (
  events: EventEmitter,
  ...p: Parameters<typeof startGeneration>
) => {
  const { content: { id, queue } } = await startGeneration(...p);
  let last: {
    progress: number,
    status: FullJob<unknown>['status']
  };
  do {
    // eslint-disable-next-line no-await-in-loop
    const { content: { progress, status } } = await getJob(queue, id);
    last = { progress, status };
    events.emit('progress', last);

    // TODO[feat]: WS ?
    let sleepDuration = 1000;
    if (last.status === 'active') {
      sleepDuration = 250;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(sleepDuration);
  } while (
    (['completed', 'failed', 'stuck']).includes(last.status as string) === false
  );
};
