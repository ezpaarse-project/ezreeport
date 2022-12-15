import chai from 'chai';
import { step } from 'mocha-steps';
import { tasks } from 'reporting-sdk-js';
import config from '~/lib/config';
import type { JsonSchema } from '~/lib/jsonSchema';
import { layoutSchema } from './templates.spec';

const { expect } = chai;

const taskSchema: JsonSchema<tasks.Task> = {
  type: 'object',
  required: ['id', 'name', 'institution', 'recurrence', 'nextRun', 'enabled', 'createdAt'],
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    institution: {
      type: 'string',
    },
    recurrence: {
      type: 'string', // TODO: support enum
    },
    nextRun: {
      type: 'object',
      format: 'date-object',
    },
    lastRun: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
    enabled: {
      type: 'boolean',
    },
    createdAt: {
      type: 'object',
      format: 'date-object',
    },
    updatedAt: {
      type: ['object', 'null', 'undefined'],
      format: ['date-object', 'undefined'],
    },
  },
};

const fullTaskSchema: JsonSchema<tasks.FullTask> = {
  type: 'object',
  required: [
    ...(taskSchema as Required<typeof taskSchema>).required,
    'template',
    'targets',
    'history',
  ],
  properties: {
    ...(taskSchema as Required<typeof taskSchema>).properties,
    template: {
      type: 'object',
      required: ['extends'],
      properties: {
        extends: {
          type: 'string',
        },
        fetchOptions: {
          type: ['object', 'undefined'],
        },
        inserts: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              ...(layoutSchema as Required<typeof layoutSchema>).required,
              'at',
            ],
            properties: {
              ...(layoutSchema as Required<typeof layoutSchema>).properties,
              at: {
                type: 'number',
              },
            },
          },
        },
      },
    },
    targets: {
      type: 'array',
    },
    history: {
      type: 'array',
    },
  },
};

export default () => {
  describe('getAllTasks()', () => {
    let res: ReturnType<typeof tasks.getAllTasks> | undefined;

    it('should return tasks', async () => {
      if (!res) {
        res = tasks.getAllTasks();
      }
      const { content } = await res;

      // eslint-disable-next-line no-restricted-syntax
      for (const task of content) {
        expect(task).to.be.jsonSchema(taskSchema);
      }
    });

    it('should contains one specific task', async () => {
      if (!res) {
        res = tasks.getAllTasks();
      }
      const { content } = await res;

      expect(
        content.findIndex(({ id }) => id === config.SDK_REPORT_TASK),
      ).to.be.not.equal(-1);
    });
  });

  describe('getTask(<string>)', () => {
    let res: ReturnType<typeof tasks.getTask> | undefined;

    it('should return a full task', async () => {
      if (!res) {
        res = tasks.getTask(config.SDK_REPORT_TASK);
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(fullTaskSchema);
    });
  });

  describe('Test course', () => {
    const input: tasks.InputTask = {
      name: 'UnitTest task',
      recurrence: tasks.Recurrence.YEARLY,
      targets: ['tom.sublet@inist.fr'],
      template: {
        extends: 'basic',
      },
      enabled: false,
    };
    let task: tasks.FullTask;
    step('createTask(<task>)', async () => {
      const { content } = await tasks.createTask(input, config.EZMESURE_INSTITUTION);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content).to.be.like(input);
      task = content;
    });

    step('enableTask(<string>)', async () => {
      const { content } = await tasks.enableTask(task.id);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content.id).to.be.equal(task.id);
      expect(content.enabled).to.be.equal(true);
      task = content;
    });

    step('disableTask(<string>)', async () => {
      const { content } = await tasks.disableTask(task.id);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content.id).to.be.equal(task.id);
      expect(content.enabled).to.be.equal(false);
      task = content;
    });

    step('updateTask(<string>) - Recurrence', async () => {
      input.recurrence = tasks.Recurrence.MONTHLY;
      const { content } = await tasks.updateTask(task.id, input);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content).to.be.like(input);
      task = content;
    });

    step('updateTask(<string>) - NextRun', async () => {
      const d = new Date(task.nextRun);
      d.setMonth(d.getMonth() + 1);
      input.nextRun = d;
      const { content } = await tasks.updateTask(task.id, input);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content.id).to.be.equal(task.id);
      expect(content).to.be.like(input);
      task = content;
    });

    step('deleteTask(<string>)', async () => {
      const { content } = await tasks.deleteTask(task.id);

      expect(content).to.be.jsonSchema(fullTaskSchema);
      expect(content).to.be.like(task);
    });
  });
};
