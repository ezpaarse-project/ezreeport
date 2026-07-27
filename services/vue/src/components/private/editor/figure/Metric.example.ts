import type { MetricLabel } from '~sdk/helpers/figures';
import type { TemplateFilter } from '~sdk/helpers/filters';

export const mockFilters: TemplateFilter[] = [
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
];

export const mockData: MetricLabel[] = [
  {
    format: {
      type: 'number',
    },
    text: 'total des accès',
  },
  {
    aggregation: {
      field: 'unit',
      type: 'cardinality',
    },
    format: {
      type: 'number',
    },
    text: 'Unités consultantes',
  },
  {
    aggregation: {
      field: 'platform',
      type: 'cardinality',
    },
    format: {
      type: 'number',
    },
    text: 'Plateformes',
  },
  {
    aggregation: {
      field: 'datetime',
      type: 'min',
    },
    format: {
      type: 'date',
    },
    text: 'Période du',
  },
  {
    aggregation: {
      field: 'datetime',
      type: 'max',
    },
    format: {
      type: 'date',
    },
    text: 'au',
  },
];
