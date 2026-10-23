import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTagView from './View.vue';

const meta: Meta<typeof TemplateTagView> = {
  component: TemplateTagView,
  title: 'Template/Tag - View',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: [],
});

export const Existing = defineStory({
  modelValue: [{ name: 'ezPAARSE' }, { color: '#001E3D', name: 'bibCNRS' }],
});
