import type { Meta, StoryObj } from '@storybook/vue3';

import GenerationJobTable from './JobTable.vue';

const meta: Meta<typeof GenerationJobTable> = {
  title: 'Queue/Generation/Job Table',
  component: GenerationJobTable,
};

export default meta;

type Story = StoryObj<typeof GenerationJobTable>;

export const Default: Story = {
  render: (args) => ({
    components: { GenerationJobTable },
    setup() {
      return { args };
    },
    template: '<GenerationJobTable v-bind="args" />',
  }),
  args: {},
};
