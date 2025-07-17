import type { Meta, StoryObj } from '@storybook/vue3-vite';

import GenerationTable from './GenerationTable.vue';

const meta: Meta<typeof GenerationTable> = {
  title: 'Public/Generations Table',
  component: GenerationTable,
};

export default meta;

type Story = StoryObj<typeof GenerationTable>;

export const Default: Story = {
  render: (args) => ({
    components: { GenerationTable },
    setup() {
      return { args };
    },
    template: '<GenerationTable v-bind="args" />',
  }),
  args: {},
};
