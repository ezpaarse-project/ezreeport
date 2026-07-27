import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import { emptyTemplate, existingTemplate } from './Template.example';
import EditorTemplate from './Template.vue';

const meta: Meta<typeof EditorTemplate> = {
  component: EditorTemplate,
  title: 'Template Editor/Template',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: emptyTemplate,
});

export const FromTemplate = defineStory({
  modelValue: existingTemplate,
});
