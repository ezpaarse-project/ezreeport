import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskCards from './TaskCards.vue';

const meta: Meta<typeof TaskCards> = {
  component: TaskCards,
  title: 'Public/Tasks Cards',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
});
