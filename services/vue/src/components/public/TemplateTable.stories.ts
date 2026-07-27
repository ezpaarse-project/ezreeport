import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTable from './TemplateTable.vue';

const meta: Meta<typeof TemplateTable> = {
  component: TemplateTable,
  title: 'Public/Templates Table',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
