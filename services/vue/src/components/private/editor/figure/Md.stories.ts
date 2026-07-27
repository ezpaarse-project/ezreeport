import type { Meta } from '@storybook/vue3-vite';
import { createMdFigureHelper } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import { mockData } from './Md.example';
import EditorFigureMd from './Md.vue';

const meta: Meta<typeof EditorFigureMd> = {
  component: EditorFigureMd,
  title: 'Template Editor/Figures/Markdown',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: createMdFigureHelper(),
});

export const Existing = defineStory({
  modelValue: createMdFigureHelper(mockData),
});

export const Readonly = defineStory({
  modelValue: createMdFigureHelper(mockData),
  readonly: true,
});
