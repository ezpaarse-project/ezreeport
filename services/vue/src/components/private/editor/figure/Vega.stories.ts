import type { Meta } from '@storybook/vue3-vite';
import { createVegaFigureHelper } from '~sdk/helpers/figures';

import { useStory } from '~/__mocks__/utils';

import EditorFigureVega from './Vega.vue';

const meta: Meta<typeof EditorFigureVega> = {
  component: EditorFigureVega,
  title: 'Template Editor/Figures/Vega',
};

const { defineStory } = useStory(meta);

export default meta;

const mockArc = createVegaFigureHelper(
  'arc',
  'répartition par mime',
  {
    aggregation: {
      field: 'mime',
      type: 'terms',
    },
    legend: null,
  },
  undefined,
  undefined,
  {
    format: 'percent',
    showLabel: true,
  },
  undefined,
  [
    {
      field: 'rtype',
      isNot: false,
      name: 'rtype is ARTICLE',
      value: 'ARTICLE',
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime is not DOC, etc.',
      value: ['DOC', 'MISC'],
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime exists',
    },
  ]
);

const mockBar = createVegaFigureHelper(
  'bar',
  'ip/fede établissements',
  {
    aggregation: {
      field: 'auth',
      type: 'terms',
    },
  },
  {},
  {
    aggregation: {
      field: 'owner',
      type: 'terms',
    },
    title: 'établissements',
  }
);

export const New = defineStory({
  modelValue: createVegaFigureHelper('line'),
});

export const ArcExisting = defineStory({
  modelValue: mockArc,
});

export const BarExisting = defineStory({
  modelValue: mockBar,
});

export const ArcReadonly = defineStory({
  modelValue: mockArc,
  readonly: true,
});

export const BarReadonly = defineStory({
  modelValue: mockBar,
  readonly: true,
});
