import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import IndexSelector from './IndexSelector.vue';

const meta: Meta<typeof IndexSelector> = {
  component: IndexSelector,
  title: 'Utils/Index Selector',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: '',
  namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
});

export const Index = defineStory({
  modelValue: 'b-bibcnrs-publisher',
});

export const IndexPattern = defineStory({
  modelValue: 'b-*',
});
