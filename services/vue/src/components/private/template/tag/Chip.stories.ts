import type { Meta, StoryObj } from '@storybook/vue3';

import TemplateTagChip from './Chip.vue';

const meta: Meta<typeof TemplateTagChip> = {
  title: 'Template/Tag - Chip',
  component: TemplateTagChip,
};

export default meta;

type Story = StoryObj<typeof TemplateTagChip>;

export const Default: Story = {
  render: (args) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
  args: {
    modelValue: { name: 'ezCOUNTER', color: '#15B0D6FF' },
  },
};

export const Light: Story = {
  render: (args) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
  args: {
    modelValue: { name: 'Some Light Tag', color: '#EEEEEEFF' },
  },
};

export const Dark: Story = {
  render: (args) => ({
    components: { TemplateTagChip },
    setup() {
      return { args };
    },
    template: '<TemplateTagChip v-bind="args" />',
  }),
  args: {
    modelValue: { name: 'Some Dark Tag', color: '#000000FF' },
  },
};
