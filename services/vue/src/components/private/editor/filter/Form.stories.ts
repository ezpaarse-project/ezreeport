import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { TemplateFilter } from '~sdk/helpers/filters';

import EditorFilterForm from './Form.vue';

const meta: Meta<typeof EditorFilterForm> = {
  component: EditorFilterForm,
  title: 'Template Editor/Filters/Form',
};

export default meta;

type Story = StoryObj<typeof EditorFilterForm>;

const mockSimpleFilter: TemplateFilter = {
  field: 'rtype',
  isNot: false,
  name: 'rtype is ARTICLE',
  value: 'ARTICLE',
};

const mockRawFilter: TemplateFilter = {
  isNot: false,
  name: 'filter-1',
  raw: {
    query_string: {
      query: '-(host:XXX.XX.XXX.X AND sid:"istex-api-harvester")',
    },
  },
};

export const NewFilter: Story = {
  args: {
    modelValue: undefined,
  },
  render: (args: unknown) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
};

export const SimpleFilter: Story = {
  args: {
    modelValue: mockSimpleFilter,
  },
  render: (args: unknown) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
};

export const RawFilter: Story = {
  args: {
    modelValue: mockRawFilter,
  },
  render: (args: unknown) => ({
    components: { EditorFilterForm },
    setup() {
      return { args };
    },
    template: '<EditorFilterForm v-bind="args" />',
  }),
};
