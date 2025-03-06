import type { Meta, StoryObj } from '@storybook/vue3';

import MailJobCard from './JobCard.vue';

const meta: Meta<typeof MailJobCard> = {
  title: 'Queue/Mail/Job Card',
  component: MailJobCard,
};

export default meta;

type Story = StoryObj<typeof MailJobCard>;

export const Default: Story = {
  render: (args) => ({
    components: { MailJobCard },
    setup() {
      return { args };
    },
    template: '<MailJobCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '2',
      data: {
        success: true,
        url: '/reports/dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb/2024/2024-12/ezREEPORT_métriques-api.rep.pdf',
        date: new Date('2024-12-18T08:58:47+01:00'),
        task: {
          id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
          recurrence: 'DAILY',
          name: 'Métriques API',
          targets: [
            'ezteam@couperin.org',
          ],
        },
        namespace: {
          id: 'clxvxybz801d84qdpy1ekrjwn',
          name: 'Administration',
        },
        generationId: '2',
      },
      result: {},
      progress: 1,
      added: new Date('2024-12-18T07:58:48.471Z'),
      started: new Date('2024-12-18T07:58:48.474Z'),
      ended: new Date('2024-12-18T07:58:48.707Z'),
      attempts: 1,
      status: 'completed',
    },
  },
};
