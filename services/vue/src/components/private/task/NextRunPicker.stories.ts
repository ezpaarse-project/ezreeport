import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskNextRunPicker from './NextRunPicker.vue';

const meta: Meta<typeof TaskNextRunPicker> = {
  component: TaskNextRunPicker,
  title: 'Task/Next Run Picker',
};

const { defineStory } = useStory(meta);

export default meta;

export const Daily = defineStory({
  offset: {},
  recurrence: 'DAILY',
});

export const Weekly = defineStory({
  offset: {},
  recurrence: 'WEEKLY',
});

export const Monthly = defineStory({
  offset: {},
  recurrence: 'MONTHLY',
});

export const Quarterly = defineStory({
  offset: {},
  recurrence: 'QUARTERLY',
});

export const Biennial = defineStory({
  offset: {},
  recurrence: 'BIENNIAL',
});

export const Yearly = defineStory({
  offset: {},
  recurrence: 'YEARLY',
});

export const Existing = defineStory({
  modelValue: new Date('2024-12-04T06:00:00.240Z'),
  offset: {},
  recurrence: 'BIENNIAL',
});

export const Readonly = defineStory({
  modelValue: new Date('2024-12-04T06:00:00.240Z'),
  offset: {},
  readonly: true,
  recurrence: 'YEARLY',
});
