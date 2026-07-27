// oxlint-disable no-default-export
import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TemplateLocaleFlag from './LocaleFlag.vue';

const meta: Meta<typeof TemplateLocaleFlag> = {
  component: TemplateLocaleFlag,
  title: 'Template/LocaleFlag',
};

const { defineStory } = useStory(meta);

export default meta;

export const French = defineStory({
  modelValue: 'fr',
});

export const English = defineStory({
  modelValue: 'en',
});

export const Unknown = defineStory({
  modelValue: 'da',
});
