import type { TemplateFilter, TemplateRawFilter } from '~/modules/templates';

type TemplateFilterMap = Map<string, TemplateFilter>;

type AnyFilter = TemplateFilter;

function isRawFilter(filter: AnyFilter): filter is TemplateRawFilter {
  return 'raw' in filter && filter.raw !== undefined;
}

export { type TemplateFilterMap, isRawFilter };
export {
  type TemplateBasicFilter,
  type TemplateRawFilter,
  type TemplateFilter,
} from '~/modules/templates';
