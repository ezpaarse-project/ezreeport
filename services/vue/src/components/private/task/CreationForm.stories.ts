import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskCreationForm from './CreationForm.vue';

const meta: Meta<typeof TaskCreationForm> = {
  title: 'Task/Creation Form (Simple)',
  component: TaskCreationForm,
};

export default meta;

type Story = StoryObj<typeof TaskCreationForm>;

export const Admin: Story = {
  render: (args) => ({
    components: { TaskCreationForm },
    setup() {
      return { args };
    },
    template: '<TaskCreationForm v-bind="args" />',
  }),
  args: {
  },
};

export const Namespaced: Story = {
  render: (args) => ({
    components: { TaskCreationForm },
    setup() {
      return { args };
    },
    template: '<TaskCreationForm v-bind="args" />',
  }),
  args: {
    namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
  },
};
