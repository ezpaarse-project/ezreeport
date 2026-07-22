import type { Meta, StoryObj } from '@storybook/vue3-vite';

import GenerationTable from './GenerationTable.vue';

const meta: Meta<typeof GenerationTable> = {
  component: GenerationTable,
  title: 'Public/Generations Table',
};

export default meta;

type Story = StoryObj<typeof GenerationTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { GenerationTable },
    setup() {
      return { args };
    },
    template: '<GenerationTable v-bind="args" />',
  }),
};
