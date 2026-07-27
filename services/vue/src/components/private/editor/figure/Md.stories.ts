import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createMdFigureHelper } from '~sdk/helpers/figures';

import { mockData } from './Md.example';
import EditorFigureMd from './Md.vue';

const meta: Meta<typeof EditorFigureMd> = {
  component: EditorFigureMd,
  title: 'Template Editor/Figures/Markdown',
};

type Story = StoryObj<typeof EditorFigureMd>;
export default meta;

export const New: Story = {
  args: {
    modelValue: createMdFigureHelper(),
  },
  render: (args: unknown) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: createMdFigureHelper(mockData),
  },
  render: (args: unknown) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: createMdFigureHelper(mockData),
    readonly: true,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
};
