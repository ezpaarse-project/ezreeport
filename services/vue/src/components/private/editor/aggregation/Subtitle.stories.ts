import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { mockBasicData, mockRawData } from './Subtitle.example';
import EditorAggregationSubtitle from './Subtitle.vue';

const meta: Meta<typeof EditorAggregationSubtitle> = {
  component: EditorAggregationSubtitle,
  title: 'Template Editor/Aggregations/Subtitle',
};

type Story = StoryObj<typeof EditorAggregationSubtitle>;

export default meta;

export const Basic: Story = {
  args: {
    modelValue: mockBasicData,
  },
  render: (args: unknown) => ({
    components: { EditorAggregationSubtitle },
    setup() {
      return { args };
    },
    template: '<EditorAggregationSubtitle v-bind="args" />',
  }),
};

export const Raw: Story = {
  args: {
    modelValue: mockRawData,
  },
  render: (args: unknown) => ({
    components: { EditorAggregationSubtitle },
    setup() {
      return { args };
    },
    template: '<EditorAggregationSubtitle v-bind="args" />',
  }),
};
