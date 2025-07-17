import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskNextRunPicker from './NextRunPicker.vue';

const meta: Meta<typeof TaskNextRunPicker> = {
  title: 'Task/Next Run Picker',
  component: TaskNextRunPicker,
};

export default meta;

type Story = StoryObj<typeof TaskNextRunPicker>;

export const Daily: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'DAILY',
    modelValue: undefined,
  },
};

export const Weekly: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'WEEKLY',
    modelValue: undefined,
  },
};

export const Monthly: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'MONTHLY',
    modelValue: undefined,
  },
};

export const Quarterly: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'QUARTERLY',
    modelValue: undefined,
  },
};

export const Biennial: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'BIENNIAL',
    modelValue: undefined,
  },
};

export const Yearly: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'YEARLY',
    modelValue: undefined,
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'DAILY',
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
  args: {
    recurrence: 'DAILY',
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
    readonly: true,
  },
};
