import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateTagChip from './Chip.vue';

const meta: Meta<typeof TemplateTagChip> = {
  component: TemplateTagChip,
  title: 'Template/Tag - Chip',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  modelValue: { color: '#15B0D6FF', name: 'ezCOUNTER' },
});

export const Light = defineStory({
  modelValue: { color: '#EEEEEEFF', name: 'Some Light Tag' },
});

export const Dark = defineStory({
  modelValue: { color: '#000000FF', name: 'Some Dark Tag' },
});
