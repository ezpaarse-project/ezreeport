import type { Meta } from '@storybook/vue3-vite';
import type { TemplateFilter } from '~sdk/helpers/filters';

import { useStory } from '~/__mocks__/utils';

import EditorFilterForm from './Form.vue';

const meta: Meta<typeof EditorFilterForm> = {
  component: EditorFilterForm,
  title: 'Template Editor/Filters/Form',
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

export const NewFilter = defineStory({
  modelValue: undefined,
});

export const SimpleFilter = defineStory({
  modelValue: mockSimpleFilter,
});

export const RawFilter = defineStory({
  modelValue: mockRawFilter,
});
