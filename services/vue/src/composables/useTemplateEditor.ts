import { elasticTypeAliases, elasticTypeIcons } from '~/lib/elastic';

import { getIndexMapping } from '~sdk/elastic';
import type { TemplateBodyGrid } from '~sdk/templates';

type Options = {
  grid?: TemplateBodyGrid;
  index?: string;
};

// Utils functions
const mappingToOption = (field: string, type: string) => ({
  value: field,
  title: field,
  props: {
    subtitle: type,
    appendIcon: elasticTypeIcons.get(elasticTypeAliases.get(type) || ''),
    class: undefined as string | undefined,
  },
});

// Reactive properties
const grid = ref<TemplateBodyGrid>({ cols: 2, rows: 2 });
const mapping = ref<Record<string, string>>({});

// Computed properties
const mappingItems = computed(
  () => Object.entries(mapping.value)
    .map(([field, type]) => mappingToOption(field, type))
    .sort((a, b) => a.value.localeCompare(b.value)),
);

export default function useTemplateEditor(defaultOptions?: Options) {
  const { t } = useI18n();

  /**
   * Refresh mapping
   *
   * @param index Index to refresh
   */
  async function refreshMapping(index: string) {
    try {
      const data = await getIndexMapping(index);
      mapping.value = data;
    } catch {
      mapping.value = {};
    }
  }

  /**
   * Get options to use in a combobox
   *
   * @param type Type of field required (use aliases)
   * @param vars Variables to add to selection
   *
   * @returns Options to use
   */
  function getOptionsFromMapping(type?: string, vars: { dateField?: boolean } = {}) {
    const items = [...mappingItems.value];

    if (vars.dateField) {
      items.unshift({
        value: '{{ dateField }}',
        title: t('$ezreeport.editor.varsList.dateField'),
        props: {
          subtitle: 'date',
          appendIcon: 'mdi-variable',
          class: 'font-italic',
        },
      });
    }

    if (type) {
      return items.filter(
        (item) => elasticTypeAliases.get(item.props.subtitle) === elasticTypeAliases.get(type),
      ).map((item) => ({ ...item, props: {} }));
    }

    return items;
  }

  // Init editor
  if (defaultOptions) {
    if (defaultOptions.grid) {
      grid.value = defaultOptions.grid;
    }

    // Fetch mapping on init
    if (defaultOptions.index) {
      refreshMapping(defaultOptions.index);
    } else {
      mapping.value = {};
    }
  }

  return {
    grid,
    refreshMapping,
    getOptionsFromMapping,
  };
}
