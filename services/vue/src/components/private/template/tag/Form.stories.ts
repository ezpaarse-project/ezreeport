import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTagForm from './Form.vue';

const meta: Meta<typeof TemplateTagForm> = {
  component: TemplateTagForm,
  title: 'Template/Tag - Form',
};

const { defineStory } = useStory(meta);

export default meta;

export const New = defineStory({
  modelValue: undefined,
});

export const Existing = defineStory({
  modelValue: { color: '#F10707', name: 'générique' },
});
