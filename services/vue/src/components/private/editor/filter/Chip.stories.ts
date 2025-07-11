import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { TemplateFilter } from '~sdk/helpers/filters';

import FilterChip from './Chip.vue';

const meta: Meta<typeof FilterChip> = {
  title: 'Template Editor/Filters/Chip',
  component: FilterChip,
};

export default meta;

type Story = StoryObj<typeof FilterChip>;

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

export const SimpleFilter: Story = {
  render: (args) => ({
    components: { FilterChip },
    setup() {
      return { args };
    },
    template: '<FilterChip v-bind="args" />',
  }),
  args: {
    modelValue: mockSimpleFilter,
  },
};

export const RawFilter: Story = {
  render: (args) => ({
    components: { FilterChip },
    setup() {
      return { args };
    },
    template: '<FilterChip v-bind="args" />',
  }),
  args: {
    modelValue: mockRawFilter,
  },
};
