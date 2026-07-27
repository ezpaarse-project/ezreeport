import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import TaskPresetForm from './Form.vue';

const meta: Meta<typeof TaskPresetForm> = {
  component: TaskPresetForm,
  title: 'Task Preset/Form',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: undefined,
});

export const Existing = defineStory({
  modelValue: {
    createdAt: new Date('2024-07-12T06:47:17.163Z'),
    fetchOptions: { dateField: 'X_Date_Month', index: '*-publisher*' },
    hidden: false,
    id: '5c5969e0-31b8-400c-98fa-0743d1faa276',
    name: 'TR Total_Item_Requests annuel',
    recurrence: 'YEARLY',
    recurrenceOffset: {},
    templateId: 'bde49b1b-c3c5-4776-96d7-e854b22c3d0f',
    updatedAt: new Date('2024-11-25T08:54:47.387Z'),
  },
});
