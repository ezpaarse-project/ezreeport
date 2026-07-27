import type { Meta, StoryObj } from '@storybook/vue3-vite';

import LocaleDate from './LocalDate.vue';

const meta: Meta<typeof LocaleDate> = {
  component: LocaleDate,
  title: 'Utils/Local Date',
};

type Story = StoryObj<typeof LocaleDate>;

export default meta;

export const Default: Story = {
  args: {
    modelValue: new Date(),
  },
  render: (args: unknown) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
};

export const FormattedDate: Story = {
  args: {
    format: 'P',
    modelValue: new Date(),
  },
  render: (args: unknown) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
};

export const FormattedTime: Story = {
  args: {
    format: 'p',
    modelValue: new Date(),
  },
  render: (args: unknown) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
};

export const FormattedDateTime: Story = {
  args: {
    format: 'PPpp',
    modelValue: new Date(),
  },
  render: (args: unknown) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
};
