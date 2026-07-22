import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskCreationForm from './CreationForm.vue';

const meta: Meta<typeof TaskCreationForm> = {
  component: TaskCreationForm,
  title: 'Task/Creation Form (Simple)',
};

export default meta;

type Story = StoryObj<typeof TaskCreationForm>;

export const Admin: Story = {
  args: {},
  render: (args: unknown) => ({
    components: { TaskCreationForm },
    setup() {
      return { args };
    },
    template: '<TaskCreationForm v-bind="args" />',
  }),
};

export const Namespaced: Story = {
  args: {
    namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
  },
  render: (args: unknown) => ({
    components: { TaskCreationForm },
    setup() {
      return { args };
    },
    template: '<TaskCreationForm v-bind="args" />',
  }),
};
