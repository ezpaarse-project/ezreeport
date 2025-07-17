import { elasticTypeAliases, elasticTypeIcons } from '~/lib/elastic';

import { getIndexMapping } from '~sdk/elastic';
import type { TemplateBodyGrid } from '~sdk/templates';

type Options = {
  grid?: TemplateBodyGrid;
  index?: string;
  dateField?: string;
  namespaceId?: string;
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
const namespaceId = ref<string | undefined>();
const dateField = ref<string>('');

// Computed properties
const mappingItems = computed(() =>
  Object.entries(mapping.value)
    .map(([field, type]) => mappingToOption(field, type))
    .sort((itemA, itemB) => itemA.value.localeCompare(itemB.value))
);

export default function useTemplateEditor(defaultOptions?: Options) {
  // oxlint-disable-next-line id-length
  const { t } = useI18n();

  /**
   * Refresh mapping
   *
   * @param index Index to refresh
   */
  async function refreshMapping(index: string) {
    try {
      const data = await getIndexMapping(index, namespaceId.value);
      mapping.value = data;
    } catch {
      mapping.value = {};
    }
  }

  function updateDateField(val: string) {
    dateField.value = val;
  }

  /**
   * Get options to use in a combobox
   *
   * @param type Type or types of field required (use aliases)
   * @param vars Variables to add to selection
   *
   * @returns Options to use
   */
  function getOptionsFromMapping(
    type?: string | string[],
    vars: { dateField?: boolean } = {}
  ) {
    const items = [...mappingItems.value];
    const types = type == null || Array.isArray(type) ? type : [type];

    if (vars.dateField) {
      items.unshift({
        value: '{{ dateField }}',
        title: t('$ezreeport.editor.varsList.dateField', {
          field: dateField.value,
        }),
        props: {
          subtitle: 'date',
          appendIcon: 'mdi-variable',
          class: 'font-italic',
        },
      });
    }

    if (types == null) {
      return items;
    }

    const optionsMap = new Map(
      types.flatMap((currentType) => {
        const alias = elasticTypeAliases.get(currentType);

        return items
          .filter(
            (item) => elasticTypeAliases.get(item.props.subtitle) === alias
          )
          .map((item) => [item.value, item]);
      })
    );

    const options = Array.from(optionsMap.values());

    if (types.length > 1) {
      return options;
    }
    // Strip props if only one type
    return options.map((item) => ({ ...item, props: {} }));
  }

  // Init editor
  if (defaultOptions) {
    namespaceId.value = defaultOptions?.namespaceId;

    if (defaultOptions.grid) {
      grid.value = defaultOptions.grid;
    }

    if (defaultOptions.dateField) {
      dateField.value = defaultOptions.dateField;
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
    updateDateField,
  };
}
