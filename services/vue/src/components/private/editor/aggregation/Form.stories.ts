import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import {
  mockBucketData,
  mockFiltersData,
  mockMetricData,
  mockRawData,
} from './Form.example';
import EditorAggregationForm from './Form.vue';

const meta: Meta<typeof EditorAggregationForm> = {
  component: EditorAggregationForm,
  title: 'Template Editor/Aggregations/Form',
};

const { defineStory } = useStory(meta);

export default meta;

export const NewMetric = defineStory({
  type: 'metric',
});

export const ExistingMetric = defineStory({
  modelValue: mockMetricData,
  type: 'metric',
});

export const NewBucket = defineStory({
  type: 'bucket',
});

export const ExistingBucket = defineStory({
  modelValue: mockBucketData,
  type: 'bucket',
});

export const ExistingRaw = defineStory({
  modelValue: mockRawData,
});

export const ExistingFilters = defineStory({
  modelValue: mockFiltersData,
});

export const Readonly = defineStory({
  modelValue: mockBucketData,
  readonly: true,
  type: 'bucket',
});

export const Disabled = defineStory({
  disabled: true,
  modelValue: mockBucketData,
  type: 'bucket',
});
