import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagChip from './Chip.vue';

const meta: Meta<typeof TemplateTagChip> = {
  component: TemplateTagChip,
  title: 'Template/Tag - Chip',
};

export default meta;

type Story = StoryObj<typeof TemplateTagChip>;

export const Default: Story = {
  args: {
    modelValue: { color: '#15B0D6FF', name: 'ezCOUNTER' },
  },
  render: (args: unknown) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
};

export const Light: Story = {
  args: {
    modelValue: { color: '#EEEEEEFF', name: 'Some Light Tag' },
  },
  render: (args: unknown) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
};

export const Dark: Story = {
  args: {
    modelValue: { color: '#000000FF', name: 'Some Dark Tag' },
  },
  render: (args: unknown) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
};
