import type { TemplateBasicFilter, TemplateRawFilter, TemplateFilter } from '~/modules/templates';

type TemplateFilterMap = Map<string, TemplateFilter>;

type AnyFilter = TemplateFilter;

function isRawFilter(filter: AnyFilter): filter is TemplateRawFilter {
  return 'raw' in filter && filter.raw !== undefined;
}

export {
  type TemplateBasicFilter,
  type TemplateRawFilter,
  type TemplateFilterMap,
  type TemplateFilter,
  isRawFilter,
};
