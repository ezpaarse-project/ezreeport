import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorAggregationOrder from './Order.vue';

const meta: Meta<typeof EditorAggregationOrder> = {
  component: EditorAggregationOrder,
  title: 'Template Editor/Aggregations/Order',
};

const { defineStory } = useStory(meta);

export default meta;

export const Basic = defineStory({});

export const Readonly = defineStory({
  readonly: true,
});
