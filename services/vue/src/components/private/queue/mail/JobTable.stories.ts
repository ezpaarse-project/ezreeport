import type { Meta, StoryObj } from '@storybook/vue3';

import MailJobTable from './JobTable.vue';

const meta: Meta<typeof MailJobTable> = {
  title: 'Queue/Mail/Job Table',
  component: MailJobTable,
};

export default meta;

type Story = StoryObj<typeof MailJobTable>;

export const Default: Story = {
  render: (args) => ({
    components: { MailJobTable },
    setup() {
      return { args };
    },
    template: '<MailJobTable v-bind="args" />',
  }),
  args: {},
};
