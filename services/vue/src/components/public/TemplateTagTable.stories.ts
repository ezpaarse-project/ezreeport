import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagTable from './TemplateTagTable.vue';

const meta: Meta<typeof TemplateTagTable> = {
  title: 'Public/Template Tags Table',
  component: TemplateTagTable,
};

export default meta;

type Story = StoryObj<typeof TemplateTagTable>;

export const Default: Story = {
  render: (args) => ({
    components: { TemplateTagTable },
    setup() {
      return { args };
    },
    template: '<TemplateTagTable v-bind="args" />',
  }),
  args: {},
};
