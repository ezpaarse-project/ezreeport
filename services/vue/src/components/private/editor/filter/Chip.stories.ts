import type { Meta } from '@storybook/vue3-vite';
import type { TemplateFilter } from '~sdk/helpers/filters';

import { useStory } from '~/__mocks__/utils';

import FilterChip from './Chip.vue';

const meta: Meta<typeof FilterChip> = {
  component: FilterChip,
  title: 'Template Editor/Filters/Chip',
};

const { defineStory } = useStory(meta);

export default meta;

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

export const SimpleFilter = defineStory({
  modelValue: mockSimpleFilter,
});

export const RawFilter = defineStory({
  modelValue: mockRawFilter,
});
