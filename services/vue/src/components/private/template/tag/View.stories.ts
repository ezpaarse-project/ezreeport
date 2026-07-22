import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagView from './View.vue';

const meta: Meta<typeof TemplateTagView> = {
  component: TemplateTagView,
  title: 'Template/Tag - View',
};

export default meta;

type Story = StoryObj<typeof TemplateTagView>;

export const Empty: Story = {
  args: {
    modelValue: [],
  },
  render: (args: unknown) => ({
    components: { TemplateTagView },
    setup() {
      return { args };
    },
    template: '<TemplateTagView v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: [{ name: 'ezPAARSE' }, { color: '#001E3D', name: 'bibCNRS' }],
  },
  render: (args: unknown) => ({
    components: { TemplateTagView },
    setup() {
      return { args };
    },
    template: '<TemplateTagView v-bind="args" />',
  }),
};
