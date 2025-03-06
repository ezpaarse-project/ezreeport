import type { Meta, StoryObj } from '@storybook/vue3';

import LocaleDate from './LocalDate.vue';

const meta: Meta<typeof LocaleDate> = {
  title: 'Utils/Local Date',
  component: LocaleDate,
};

export default meta;

type Story = StoryObj<typeof LocaleDate>;

export const Default: Story = {
  render: (args) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
  args: {
    modelValue: new Date(),
  },
};

export const FormattedDate: Story = {
  render: (args) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
  args: {
    modelValue: new Date(),
    format: 'P',
  },
};

export const FormattedTime: Story = {
  render: (args) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
  args: {
    modelValue: new Date(),
    format: 'p',
  },
};

export const FormattedDateTime: Story = {
  render: (args) => ({
    components: { LocaleDate },
    setup() {
      return { args };
    },
    template: '<LocaleDate v-bind="args" />',
  }),
  args: {
    modelValue: new Date(),
    format: 'PPpp',
  },
};
