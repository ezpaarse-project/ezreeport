import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskPresetForm from './Form.vue';

const meta: Meta<typeof TaskPresetForm> = {
  component: TaskPresetForm,
  title: 'Task Preset/Form',
};

export default meta;

type Story = StoryObj<typeof TaskPresetForm>;

export const Empty: Story = {
  args: {
    modelValue: undefined,
  },
  render: (args: unknown) => ({
    components: { TaskPresetForm },
    setup() {
      return { args };
    },
    template: '<TaskPresetForm v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
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
  },
  render: (args: unknown) => ({
    components: { TaskPresetForm },
    setup() {
      return { args };
    },
    template: '<TaskPresetForm v-bind="args" />',
  }),
};
