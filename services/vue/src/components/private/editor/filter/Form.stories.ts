import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { TemplateFilter } from '~sdk/helpers/filters';

import EditorFilterForm from './Form.vue';

const meta: Meta<typeof EditorFilterForm> = {
  title: 'Template Editor/Filters/Form',
  component: EditorFilterForm,
};

export default meta;

type Story = StoryObj<typeof EditorFilterForm>;

const mockSimpleFilter: TemplateFilter = {
  name: 'rtype is ARTICLE',
  field: 'rtype',
  isNot: false,
  value: 'ARTICLE',
};

const mockRawFilter: TemplateFilter = {
  name: 'filter-1',
  raw: { query_string: { query: '-(host:XXX.XX.XXX.X AND sid:"istex-api-harvester")' } },
  isNot: false,
};

export const NewFilter: Story = {
  render: (args) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
  },
};

export const SimpleFilter: Story = {
  render: (args) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
  args: {
    modelValue: mockSimpleFilter,
  },
};

export const RawFilter: Story = {
  render: (args) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
  args: {
    modelValue: mockRawFilter,
  },
};
