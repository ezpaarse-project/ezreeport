import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskEditionForm from './EditionForm.vue';

const meta: Meta<typeof TaskEditionForm> = {
  component: TaskEditionForm,
  title: 'Task/Edition Form (Simple)',
};

export default meta;

type Story = StoryObj<typeof TaskEditionForm>;

export const Default: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      description: '',
      enabled: true,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      extends: {
        locale: 'fr',
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
        inserts: [],
        version: 2,
      },
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskEditionForm },
    setup() {
      return { args };
    },
    template: '<TaskEditionForm v-bind="args" />',
  }),
};
