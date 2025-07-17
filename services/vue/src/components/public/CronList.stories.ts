import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CronList from './CronList.vue';

const meta: Meta<typeof CronList> = {
  title: 'Public/Cron List',
  component: CronList,
};

export default meta;

type Story = StoryObj<typeof CronList>;

export const Default: Story = {
  render: (args) => ({
    components: { CronList },
    setup() {
      return { args };
    },
    template: '<CronList v-bind="args" />',
  }),
  args: {},
};
