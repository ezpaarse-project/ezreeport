import type { Meta, StoryObj } from '@storybook/vue3-vite';

import HealthStatus from './HealthStatus.vue';

const meta: Meta<typeof HealthStatus> = {
  component: HealthStatus,
  title: 'Public/Health Status',
};

export default meta;

type Story = StoryObj<typeof HealthStatus>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { HealthStatus },
    setup() {
      return { args };
    },
    template: '<HealthStatus v-bind="args" />',
  }),
};
