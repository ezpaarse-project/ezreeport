import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { MetricLabel } from '~sdk/helpers/figures';

import EditorFigureMetricElementForm from './MetricElementForm.vue';

const meta: Meta<typeof EditorFigureMetricElementForm> = {
  component: EditorFigureMetricElementForm,
  title: 'Template Editor/Figures/Metric/ Element Form',
};

export default meta;

type Story = StoryObj<typeof EditorFigureMetricElementForm>;

const mockData: MetricLabel = {
  format: {
    type: 'number',
  },
  text: 'total des accès',
};

export const New: Story = {
  render: (args: unknown) => ({
    components: { EditorFigureMetricElementForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElementForm v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: mockData,
  },
  render: (args: unknown) => ({
    components: { EditorFigureMetricElementForm },
    setup() {
      return { args };
    },
    template: '<EditorFigureMetricElementForm v-bind="args" />',
  }),
};
