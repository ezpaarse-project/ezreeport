import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskPresetForm from './Form.vue';

const meta: Meta<typeof TaskPresetForm> = {
  title: 'Task Preset/Form',
  component: TaskPresetForm,
};

export default meta;

type Story = StoryObj<typeof TaskPresetForm>;

export const Empty: Story = {
  render: (args) => ({
    components: { TaskPresetForm },
    setup() {
      return { args };
    },
    template: '<TaskPresetForm v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TaskPresetForm },
    setup() {
      return { args };
    },
    template: '<TaskPresetForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '5c5969e0-31b8-400c-98fa-0743d1faa276',
      name: 'TR Total_Item_Requests annuel',
      templateId: 'bde49b1b-c3c5-4776-96d7-e854b22c3d0f',
      fetchOptions: { index: '*-publisher*', dateField: 'X_Date_Month' },
      hidden: false,
      recurrence: 'YEARLY',
      recurrenceOffset: {},
      createdAt: new Date('2024-07-12T06:47:17.163Z'),
      updatedAt: new Date('2024-11-25T08:54:47.387Z'),
    },
  },
};
