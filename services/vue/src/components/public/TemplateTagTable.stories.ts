import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTagTable from './TemplateTagTable.vue';

const meta: Meta<typeof TemplateTagTable> = {
  component: TemplateTagTable,
  title: 'Public/Template Tags Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
