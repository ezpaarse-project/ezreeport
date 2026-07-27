import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagTable from './TemplateTagTable.vue';

const meta: Meta<typeof TemplateTagTable> = {
  component: TemplateTagTable,
  title: 'Public/Template Tags Table',
};

export default meta;

type Story = StoryObj<typeof TemplateTagTable>;

export const Default: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TemplateTagTable },
    setup() {
      return { args };
    },
    template: '<TemplateTagTable v-bind="args" />',
  }),
};
