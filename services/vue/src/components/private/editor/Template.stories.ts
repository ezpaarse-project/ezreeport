import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { emptyTemplate, existingTemplate } from './Template.example';
import EditorTemplate from './Template.vue';

const meta: Meta<typeof EditorTemplate> = {
  component: EditorTemplate,
  title: 'Template Editor/Template',
};

type Story = StoryObj<typeof EditorTemplate>;

export default meta;

export const Empty: Story = {
  args: {
    modelValue: emptyTemplate,
  },
  render: (args: unknown) => ({
    components: { EditorTemplate },
    setup() {
      return { args };
    },
    template: '<EditorTemplate v-bind="args" />',
  }),
};
export const FromTemplate: Story = {
  args: {
    modelValue: existingTemplate,
  },
  render: (args: unknown) => ({
    components: { EditorTemplate },
    setup() {
      return { args };
    },
    template: '<EditorTemplate v-bind="args" />',
  }),
};
