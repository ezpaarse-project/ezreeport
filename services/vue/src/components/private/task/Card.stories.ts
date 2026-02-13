import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskCard from './Card.vue';

const meta: Meta<typeof TaskCard> = {
  title: 'Task/Card',
  component: TaskCard,
};

export default meta;

type Story = StoryObj<typeof TaskCard>;

export const Default: Story = {
  render: (args) => ({
    components: { TaskCard },
    setup() {
      return { args };
    },
    template: '<TaskCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      name: 'Métriques API',
      description: '',
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
