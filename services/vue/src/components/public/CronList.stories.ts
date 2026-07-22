import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CronList from './CronList.vue';

const meta: Meta<typeof CronList> = {
  component: CronList,
  title: 'Public/Cron List',
};

export default meta;

type Story = StoryObj<typeof CronList>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { CronList },
    setup() {
      return { args };
    },
    template: '<CronList v-bind="args" />',
  }),
};
