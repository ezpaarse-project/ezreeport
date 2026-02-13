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
    offset: {},
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
    offset: {},
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
    offset: {},
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
    offset: {},
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
    offset: {},
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
    offset: {},
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
    recurrence: 'BIENNIAL',
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
    offset: {},
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
    recurrence: 'YEARLY',
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
    offset: {},
    readonly: true,
  },
};
