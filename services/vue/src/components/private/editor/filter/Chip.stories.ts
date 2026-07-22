import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { TemplateFilter } from '~sdk/helpers/filters';

import FilterChip from './Chip.vue';

const meta: Meta<typeof FilterChip> = {
  component: FilterChip,
  title: 'Template Editor/Filters/Chip',
};

export default meta;

type Story = StoryObj<typeof FilterChip>;

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

export const SimpleFilter: Story = {
  args: {
    modelValue: mockSimpleFilter,
  },
  render: (args: unknown) => ({
    components: { FilterChip },
    setup() {
      return { args };
    },
    template: '<FilterChip v-bind="args" />',
  }),
};

export const RawFilter: Story = {
  args: {
    modelValue: mockRawFilter,
  },
  render: (args: unknown) => ({
    components: { FilterChip },
    setup() {
      return { args };
    },
    template: '<FilterChip v-bind="args" />',
  }),
};
