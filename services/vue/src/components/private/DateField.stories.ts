import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import DateField from './DateField.vue';

const meta: Meta<typeof DateField> = {
  component: DateField,
  title: 'Utils/Date Field',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  modelValue: new Date(),
});
