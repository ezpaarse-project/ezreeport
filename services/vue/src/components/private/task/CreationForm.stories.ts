import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskCreationForm from './CreationForm.vue';

const meta: Meta<typeof TaskCreationForm> = {
  component: TaskCreationForm,
  title: 'Task/Creation Form (Simple)',
};

const { defineStory } = useStory(meta);

export default meta;

export const Admin = defineStory({});

export const Namespaced = defineStory({
  namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
});
