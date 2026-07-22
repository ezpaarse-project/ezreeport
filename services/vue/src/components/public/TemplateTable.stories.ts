import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTable from './TemplateTable.vue';

const meta: Meta<typeof TemplateTable> = {
  component: TemplateTable,
  title: 'Public/Templates Table',
};

export default meta;

type Story = StoryObj<typeof TemplateTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TemplateTable },
    setup() {
      return { args };
    },
    template: '<TemplateTable v-bind="args" />',
  }),
};
