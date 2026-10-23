import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import LocaleDate from './LocalDate.vue';

const meta: Meta<typeof LocaleDate> = {
  component: LocaleDate,
  title: 'Utils/Local Date',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  modelValue: new Date(),
});

export const FormattedDate = defineStory({
  format: 'P',
  modelValue: new Date(),
});

export const FormattedTime = defineStory({
  format: 'p',
  modelValue: new Date(),
});

export const FormattedDateTime = defineStory({
  format: 'PPpp',
  modelValue: new Date(),
});
