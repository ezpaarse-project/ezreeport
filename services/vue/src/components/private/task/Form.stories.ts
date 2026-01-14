import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { createTaskHelper, createTaskHelperFrom } from '~sdk/helpers/tasks';
import TaskForm from './Form.vue';

const meta: Meta<typeof TaskForm> = {
  title: 'Task/Form (Advanced)',
  component: TaskForm,
};

export default meta;

type Story = StoryObj<typeof TaskForm>;

export const New: Story = {
  render: (args) => ({
    components: { TaskForm },
    setup() {
      return { args };
    },
    template: '<TaskForm v-bind="args" />',
  }),
  args: {
    modelValue: createTaskHelper(),
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TaskForm },
    setup() {
      return { args };
    },
    template: '<TaskForm v-bind="args" />',
  }),
  args: {
    modelValue: createTaskHelperFrom({
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      name: 'Métriques API',
      description: '',
      template: {
        version: 2,
        index: '.ezmesure-metrics',
        dateField: 'datetime',
        filters: [],
        inserts: [
          {
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
            at: 1,
          },
        ],
      },
      targets: ['ezteam@couperin.org'],
      recurrence: 'DAILY',
      recurrenceOffset: {},
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      enabled: true,
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
      extends: {
        tags: [{ id: '0', name: 'Administration', color: '#D3339A' }],
      },
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    }),
  },
};
