import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTable from './TemplateTable.vue';

const meta: Meta<typeof TemplateTable> = {
  title: 'Public/Templates Table',
  component: TemplateTable,
};

export default meta;

type Story = StoryObj<typeof TemplateTable>;

export const Default: Story = {
  render: (args) => ({
    components: { TemplateTable },
    setup() {
      return { args };
    },
    template: '<TemplateTable v-bind="args" />',
  }),
  args: {},
};
