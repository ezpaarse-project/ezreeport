import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import GenerationTable from './GenerationTable.vue';

const meta: Meta<typeof GenerationTable> = {
  component: GenerationTable,
  title: 'Public/Generations Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
