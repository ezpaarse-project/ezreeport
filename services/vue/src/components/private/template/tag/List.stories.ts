import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagList from './List.vue';

const meta: Meta<typeof TemplateTagList> = {
  component: TemplateTagList,
  title: 'Template/Tag - List',
};

export default meta;

type Story = StoryObj<typeof TemplateTagList>;

export const Empty: Story = {
  args: {
    modelValue: new Map(),
  },
  render: (args: unknown) => ({
    components: { TemplateTagList },
    setup() {
      return { args };
    },
    template: '<TemplateTagList v-bind="args" />',
  }),
};

export const Existing: Story = {
  args: {
    modelValue: new Map([
      ['ezPAARSE', { name: 'ezPAARSE' }],
      ['bibCNRS', { color: '#001E3D', name: 'bibCNRS' }],
    ]),
  },
  render: (args: unknown) => ({
    components: { TemplateTagList },
    setup() {
      return { args };
    },
    template: '<TemplateTagList v-bind="args" />',
  }),
};
