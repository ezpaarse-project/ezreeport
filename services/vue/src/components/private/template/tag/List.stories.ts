import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TemplateTagList from './List.vue';

const meta: Meta<typeof TemplateTagList> = {
  title: 'Template/Tag - List',
  component: TemplateTagList,
};

export default meta;

type Story = StoryObj<typeof TemplateTagList>;

export const Empty: Story = {
  render: (args) => ({
    components: { TemplateTagList },
    setup() {
      return { args };
    },
    template: '<TemplateTagList v-bind="args" />',
  }),
  args: {
    modelValue: new Map([]),
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { TemplateTagList },
    setup() {
      return { args };
    },
    template: '<TemplateTagList v-bind="args" />',
  }),
  args: {
    modelValue: new Map([
      ['ezPAARSE', { name: 'ezPAARSE' }],
      ['bibCNRS', { name: 'bibCNRS', color: '#001E3D' }],
    ]),
  },
};
