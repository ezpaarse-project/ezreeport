// oxlint-disable no-default-export
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateLocaleFlag from './LocaleFlag.vue';

const meta: Meta<typeof TemplateLocaleFlag> = {
  component: TemplateLocaleFlag,
  title: 'Template/LocaleFlag',
};

export default meta;

type Story = StoryObj<typeof TemplateLocaleFlag>;

export const French: Story = {
  args: {
    modelValue: 'fr',
  },
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
};

export const English: Story = {
  args: {
    modelValue: 'en',
  },
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
};

export const Unknown: Story = {
  args: {
    modelValue: 'da',
  },
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
};
