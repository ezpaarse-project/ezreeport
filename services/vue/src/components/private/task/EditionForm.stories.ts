import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskEditionForm from './EditionForm.vue';

const meta: Meta<typeof TaskEditionForm> = {
  title: 'Task/Edition Form (Simple)',
  component: TaskEditionForm,
};

export default meta;

type Story = StoryObj<typeof TaskEditionForm>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskEditionForm },
    setup() {
      return { args };
    },
    template: '<TaskEditionForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      name: 'Métriques API',
      description: '',
      template: {
        version: 2,
        index: '.ezmesure-metrics',
        dateField: 'datetime',
        filters: [],
        inserts: [],
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
    },
  },
};
