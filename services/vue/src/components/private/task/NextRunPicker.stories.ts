import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskNextRunPicker from './NextRunPicker.vue';

const meta: Meta<typeof TaskNextRunPicker> = {
  component: TaskNextRunPicker,
  title: 'Task/Next Run Picker',
};

export default meta;

type Story = StoryObj<typeof TaskNextRunPicker>;

export const Daily: Story = {
  args: {
    offset: {},
    recurrence: 'DAILY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Weekly: Story = {
  args: {
    offset: {},
    recurrence: 'WEEKLY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Monthly: Story = {
  args: {
    offset: {},
    recurrence: 'MONTHLY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Quarterly: Story = {
  args: {
    offset: {},
    recurrence: 'QUARTERLY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Biennial: Story = {
  args: {
    offset: {},
    recurrence: 'BIENNIAL',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Yearly: Story = {
  args: {
    offset: {},
    recurrence: 'YEARLY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
    offset: {},
    recurrence: 'BIENNIAL',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};

export const Readonly: Story = {
  args: {
    modelValue: new Date('2024-12-04T06:00:00.240Z'),
    offset: {},
    readonly: true,
    recurrence: 'YEARLY',
  },
  render: (args: unknown) => ({
    components: { TaskNextRunPicker },
    setup() {
      return { args };
    },
    template: '<TaskNextRunPicker v-bind="args" />',
  }),
};
