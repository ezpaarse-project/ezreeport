// oxlint-disable no-default-export
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateLocaleFlag from './LocaleFlag.vue';

const meta: Meta<typeof TemplateLocaleFlag> = {
  title: 'Template/LocaleFlag',
  component: TemplateLocaleFlag,
};

export default meta;

type Story = StoryObj<typeof TemplateLocaleFlag>;

export const French: Story = {
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
  args: {
    modelValue: 'fr',
  },
};

export const English: Story = {
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
  args: {
    modelValue: 'en',
  },
};

export const Unknown: Story = {
  render: (args: unknown) => ({
    components: { TemplateLocaleFlag },
    setup() {
      return { args };
    },
    template: '<TemplateLocaleFlag v-bind="args" />',
  }),
  args: {
    modelValue: 'da',
  },
};
