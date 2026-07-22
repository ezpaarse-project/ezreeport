import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createTaskHelper, createTaskHelperFrom } from '~sdk/helpers/tasks';

import TaskForm from './Form.vue';

const meta: Meta<typeof TaskForm> = {
  component: TaskForm,
  title: 'Task/Form (Advanced)',
};

export default meta;

type Story = StoryObj<typeof TaskForm>;

export const New: Story = {
  args: {
    modelValue: createTaskHelper(),
  },
  render: (args: unknown) => ({
    components: { TaskForm },
    setup() {
      return { args };
    },
    template: '<TaskForm v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: createTaskHelperFrom({
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      description: '',
      enabled: true,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      extends: {
        tags: [{ color: '#D3339A', id: '0', name: 'Administration' }],
      },
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      name: 'Métriques API',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      recurrence: 'DAILY',
      recurrenceOffset: {},
      targets: ['ezteam@couperin.org'],
      template: {
        dateField: 'datetime',
        filters: [],
        index: '.ezmesure-metrics',
        inserts: [
          {
            at: 1,
            figures: [
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    title: 'datetime',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'panist : histo jour requêtes',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
              },
            ],
          },
        ],
        version: 2,
      },
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
    }),
  },
  render: (args: unknown) => ({
    components: { TaskForm },
    setup() {
      return { args };
    },
    template: '<TaskForm v-bind="args" />',
  }),
};
