import type { Task } from '@prisma/client';
import { parseISO } from 'date-fns';
import vegaGenerator from '../generators/vega';
import layout from '../layouts/test';
import { addTaskHistory } from './tasks';

export const generateReport = async (task: Task, origin: string, writeHistory = true) => {
  const targets = task.targets.filter((email) => email !== '');
  if (targets.length <= 0) {
    return { success: false, content: "Targets can't be null" };
  }

  const filename = 'Test API';
  await vegaGenerator(
    layout, // TODO: use task layout. define layout as JSON
    {
      name: 'Test API',
      path: 'data/api.pdf',
      periodStart: parseISO('2021-01-01T00:00:00.000+01:00'),
      periodEnd: parseISO('2021-12-31T23:59:59.999+01:00'),
    },
    {
      index: 'bibcnrs-*-2021',
      filters: {
        must_not: [
          {
            match_phrase: {
              mime: {
                query: 'XLS',
              },
            },
          },
          {
            match_phrase: {
              mime: {
                query: 'DOC',
              },
            },
          },
          {
            match_phrase: {
              mime: {
                query: 'MISC',
              },
            },
          },
          {
            match_phrase: {
              index_name: {
                query: 'bibcnrs-insb-dcm00',
              },
            },
          },
          {
            match_phrase: {
              index_name: {
                query: 'bibcnrs-insb-dcm30',
              },
            },
          },
          {
            match_phrase: {
              index_name: {
                query: 'bibcnrs-insb-dcm10',
              },
            },
          },
          {
            match_phrase: {
              index_name: {
                query: 'bibcnrs-insb-anonyme',
              },
            },
          },
        ],
      },
    },
  );

  // TODO : email

  if (writeHistory) {
    await addTaskHistory(task.id, { type: 'generation', message: `Rapport "${filename}" généré par ${origin}` });
  }

  return {
    success: true,
    content: {},
  };
};

export const a = 1;
