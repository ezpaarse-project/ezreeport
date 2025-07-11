import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { MetricLabel } from '~sdk/helpers/figures';

import EditorFigureMetricElementForm from './MetricElementForm.vue';

const meta: Meta<typeof EditorFigureMetricElementForm> = {
  title: 'Template Editor/Figures/Metric/ Element Form',
  component: EditorFigureMetricElementForm,
};

export default meta;

type Story = StoryObj<typeof EditorFigureMetricElementForm>;

const mockData: MetricLabel = {
  text: 'total des accès',
  format: {
    type: 'number',
  },
};

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureMetricElementForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElementForm v-bind="args" />',
  }),
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureMetricElementForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElementForm v-bind="args" />',
  }),
  args: {
    modelValue: mockData,
  },
};
