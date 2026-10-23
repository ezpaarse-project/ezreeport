import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTagList from './List.vue';

const meta: Meta<typeof TemplateTagList> = {
  component: TemplateTagList,
  title: 'Template/Tag - List',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: new Map(),
});

export const Existing = defineStory({
  modelValue: new Map([
    ['ezPAARSE', { name: 'ezPAARSE' }],
    ['bibCNRS', { color: '#001E3D', name: 'bibCNRS' }],
  ]),
});
