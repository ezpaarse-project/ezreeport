import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import EditorFilterImporter from './Importer.vue';

const meta: Meta<typeof EditorFilterImporter> = {
  component: EditorFilterImporter,
  title: 'Template Editor/Filters/Importer',
};

const { defineStory } = useStory(meta);

export default meta;

export const Basic = defineStory({});
