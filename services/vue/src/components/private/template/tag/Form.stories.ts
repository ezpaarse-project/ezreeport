import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagForm from './Form.vue';

const meta: Meta<typeof TemplateTagForm> = {
  component: TemplateTagForm,
  title: 'Template/Tag - Form',
};

export default meta;

type Story = StoryObj<typeof TemplateTagForm>;

export const New: Story = {
  args: {
    modelValue: undefined,
  },
  render: (args: unknown) => ({
    components: { TemplateTagForm },
    setup() {
      return { args };
    },
    template: '<TemplateTagForm v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: { color: '#F10707', name: 'générique' },
  },
  render: (args: unknown) => ({
    components: { TemplateTagForm },
    setup() {
      return { args };
    },
    template: '<TemplateTagForm v-bind="args" />',
  }),
};
