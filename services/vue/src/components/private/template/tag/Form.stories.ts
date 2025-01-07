import type { Meta, StoryObj } from '@storybook/vue3';

import TemplateTagForm from './Form.vue';

const meta: Meta<typeof TemplateTagForm> = {
  title: 'Template/Tag - Form',
  component: TemplateTagForm,
};

export default meta;

type Story = StoryObj<typeof TemplateTagForm>;

export const New: Story = {
  render: (args) => ({
    components: { TemplateTagForm },
    setup() {
      return { args };
    },
    template: '<TemplateTagForm v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TemplateTagForm },
    setup() {
      return { args };
    },
    template: '<TemplateTagForm v-bind="args" />',
  }),
  args: {
    modelValue: { name: 'générique', color: '#F10707' },
  },
};
