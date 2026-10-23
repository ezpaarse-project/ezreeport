import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import { mockBasicData, mockRawData } from './Subtitle.example';
import EditorAggregationSubtitle from './Subtitle.vue';

const meta: Meta<typeof EditorAggregationSubtitle> = {
  component: EditorAggregationSubtitle,
  title: 'Template Editor/Aggregations/Subtitle',
};

const { defineStory } = useStory(meta);

export default meta;

export const Basic = defineStory({
  modelValue: mockBasicData,
});

export const Raw = defineStory({
  modelValue: mockRawData,
});
