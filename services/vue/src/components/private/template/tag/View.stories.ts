import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagView from './View.vue';

const meta: Meta<typeof TemplateTagView> = {
  title: 'Template/Tag - View',
  component: TemplateTagView,
};

export default meta;

type Story = StoryObj<typeof TemplateTagView>;

export const Empty: Story = {
  render: (args) => ({
    components: { TemplateTagView },
    setup() {
      return { args };
    },
    template: '<TemplateTagView v-bind="args" />',
  }),
  args: {
    modelValue: [],
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TemplateTagView },
    setup() {
      return { args };
    },
    template: '<TemplateTagView v-bind="args" />',
  }),
  args: {
    modelValue: [
      { name: 'ezPAARSE' },
      { name: 'bibCNRS', color: '#001E3D' },
    ],
  },
};
