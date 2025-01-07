import type { Meta, StoryObj } from '@storybook/vue3';

import HealthStatus from './HealthStatus.vue';

const meta: Meta<typeof HealthStatus> = {
  title: 'Public/Health Status',
  component: HealthStatus,
};

export default meta;

type Story = StoryObj<typeof HealthStatus>;

export const Default: Story = {
  render: (args) => ({
    components: { HealthStatus },
    setup() {
      return { args };
    },
    template: '<HealthStatus v-bind="args" />',
  }),
  args: {},
};
