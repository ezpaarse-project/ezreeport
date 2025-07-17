import type { MigrationData } from './common.js';

const name = '2.0.0';

/**
 * Migrate a raw filter to the new format
 *
 * @param filter The ES filter
 * @param i Index of the filter
 * @param isNot Whether the filter is negated
 *
 * @returns The migrated filter
 */
const migrateEsFilter = (filter: any, i: number, isNot = false) => {
  if ('exists' in filter && filter.exists) {
    const { field } = filter.exists;
    if (field) {
      return {
        name: [field, isNot ? "doesn't" : 'does', 'exists'].join(' '),
        field,
        isNot,
      };
    }
  }
  if ('match_phrase' in filter && filter.match_phrase) {
    const field = Object.keys(filter.match_phrase)[0];
    const value = filter.match_phrase[field];
    if (value && typeof value !== 'object') {
      return {
        name: [field, 'is', isNot ? 'not' : '', value].filter((x) => !!x).join(' '),
        field,
        isNot,
        value,
      };
    }
  }
  if ('bool' in filter && filter.bool) {
    const subFilters = filter.bool.should;
    if (subFilters) {
      const values = subFilters.map(
        (f: any) => {
          const field = Object.keys(f.match_phrase ?? {})[0];
          const value = f.match_phrase?.[field];
          return {
            name: [field, 'is', isNot ? 'not' : '', value].filter((x) => !!x).join(' '),
            field,
            isNot,
            value,
          };
        },
      ).filter((f: any) => f.field);

      const firstField = values[0]?.field;
      if (values.length > 0 && values.every((f: any) => f.field === firstField)) {
        const valueParts = values.slice(0, 2).map((f: any) => f.value);
        const valueText = [...valueParts, 'etc.'].join(', ');

        return {
          name: [firstField, 'is', isNot ? 'not' : '', valueText].join(' '),
          field: firstField,
          isNot,
          value: values.map((f: any) => f.value),
        };
      }
    }
  }
  return {
    name: ['filter', isNot ? 'not' : '', i + 1].filter((x) => !!x).join('-'),
    raw: filter,
    isNot,
  };
};

/**
 * Migrate an ES aggregation to the new format
 *
 * @param aggregation The ES aggregation
 *
 * @returns The migrated aggregation
 */
const migrateEsAggregation = (aggregation: any) => {
  if (!aggregation) {
    return undefined;
  }
  const { name: _, ...agg } = aggregation;
  const type = Object.keys(agg)[0];
  const field = agg[type]?.field;
  if (!field) {
    return {
      raw: agg,
    };
  }

  const size = agg[type]?.size;
  const missing = agg[type]?.missing;
  return {
    type,
    field,
    size,
    missing,
  };
};

/**
 * Map ES aggregations and migrate them to the new format
 *
 * @param aggregations The ES aggregations
 *
 * @returns A map with the name of the aggregation as the key and the
 * migrated aggregation as the value
 */
const mapEsAggregations = (aggregations: any) => new Map<string, any>(
  (aggregations ?? []).map((agg: any) => [agg.name, migrateEsAggregation(agg)]),
);

/**
 * Migrate filters from the old format to the new format
 *
 * @param filters The old filters
 *
 * @returns The migrated filters
 */
const migrateFilters = (filters: { filter: any[], must_not: any[] } | undefined) => {
  if (!filters) {
    return [];
  }

  const res = [];
  if (filters.filter) {
    res.push(
      ...filters.filter.map((filter, i) => migrateEsFilter(filter, i)),
    );
  }
  if (filters.must_not) {
    res.push(
      ...filters.must_not.map((filter, i) => migrateEsFilter(filter, i, true)),
    );
  }

  return res;
};

/**
 * Apply aggregations in params of a metric figure
 *
 * @param figure The original params
 *
 * @returns The migrated params
 */
const migrateMetricParams = ({ params, fetchOptions }: any) => {
  const aggMap = mapEsAggregations(fetchOptions.aggs);
  return {
    ...params,
    labels: params.labels.map((label: any) => ({
      ...label,
      field: undefined,
      dataKey: undefined,
      aggregation: aggMap.get(label.dataKey),
    })),
  };
};
/**
 * Apply aggregations in params of a table figure
 *
 * @param figure The original params
 *
 * @returns The migrated params
 */
const migrateTableParams = ({ params, fetchOptions }: any) => {
  const { dataKey, maxLength } = params;
  const bucketMap = mapEsAggregations([...fetchOptions.buckets, fetchOptions.metric ?? {}]);
  const columnStyles = new Map(Object.entries(params.columnStyles ?? {}));

  const columns = (params.columns as any[]).map(({ dataKey: dK, ...column }, i) => {
    let aggregation;
    let matches;
    if (
      // oxlint-disable-next-line no-constant-binary-expression
      dK === 'key' ? (matches = ['', dataKey]) : false
      // oxlint-disable-next-line no-constant-binary-expression
      || (matches = /^(?:.+\.)?(.+)\.key$/.exec(dK)) !== null
      // oxlint-disable-next-line no-constant-binary-expression
      || (matches = /^(?:.+\.)?(.+)\.value$/.exec(dK)) !== null
    ) {
      aggregation = bucketMap.get(matches?.[1]);
    }

    if (aggregation && !aggregation.size && i === 0) {
      aggregation.size = maxLength;
    }

    return {
      ...column,
      metric: i === params.columns.length - 1,
      styles: columnStyles.get(dK),
      aggregation,
    };
  });

  return {
    ...params,
    dataKey: undefined,
    totals: undefined,
    maxLength: undefined,
    columnStyles: undefined,
    total: (params.totals?.length ?? 0) > 0,
    columns,
  };
};
/**
 * Apply aggregations in params of a vega figure
 *
 * @param figure The original params
 *
 * @returns The migrated params
 */
const migrateOtherParams = ({ params, fetchOptions }: any) => {
  const bucketMap = mapEsAggregations([...fetchOptions.buckets, fetchOptions.metric ?? {}]);
  const { dataKey } = params;

  const labelAgg = bucketMap.get(dataKey) ?? {};
  const label = {
    ...params.label,
    field: undefined,
    aggregation: labelAgg,
  };

  const valueAgg = migrateEsAggregation(fetchOptions.metric);
  const value = {
    ...params.value,
    field: undefined,
    aggregation: valueAgg,
  };

  let color;
  if (params.color) {
    const matches = /^(?:.+\.)?(.+)\.key$/.exec(params.color.field);
    const colorAgg = bucketMap.get(matches?.[1] || '') ?? {};
    color = {
      ...params.color,
      field: undefined,
      aggregation: colorAgg,
    };
  }

  return {
    ...params,
    dataKey: undefined,
    label,
    color,
    value,
  };
};

/**
 * Migrate figures : moving filters out of fetchOptions, putting aggregations in params
 *
 * @param figures The original figures
 *
 * @returns Migrated figures
 */
const migrateFigures = (figures: any[] | undefined) => (figures ?? []).map((figure: any) => {
  const filters = migrateFilters(figure.fetchOptions?.filters);
  let params = {};
  switch (figure.type) {
    case 'md':
      break;

    case 'metric':
      params = migrateMetricParams(figure);
      break;

    case 'table':
      params = migrateTableParams(figure);
      break;

    default:
      params = migrateOtherParams(figure);
      break;
  }

  return {
    ...figure,
    fetchOptions: undefined,
    filters,
    params,
  };
});

/**
 * Migrate layouts
 *
 * @param layouts The original layouts
 *
 * @returns Migrated layouts
 */
const migrateLayouts = (layouts: any[] | undefined) => (layouts ?? []).map((layout: any) => ({
  ...layout,
  fetchOptions: undefined,
  figures: migrateFigures(layout.figures),
}));

/**
 * Migrate templates: moving index, dateField and filters out of fetchOptions
 *
 * @param templates The original templates
 *
 * @returns Migrated templates
 */
const migrateTemplates = (templates: any[]) => templates.map((template: any) => ({
  ...template,
  body: {
    version: 2,
    index: template.body?.fetchOptions?.index,
    dateField: template.body?.fetchOptions?.dateField,
    filters: migrateFilters(template.body?.fetchOptions?.filters),
    layouts: migrateLayouts(template.body?.layouts),
  },
}));

/**
 * Migrate inserts
 *
 * @param tasks The original tasks
 *
 * @returns Migrated tasks
 */
const migrateTasks = (tasks: any[]) => tasks.map((task: any) => ({
  ...task,
  extended: undefined,
  extendedId: task.extends.id,
  namespace: undefined,
  namespaceId: task.namespace.id,
  template: {
    version: 2,
    index: task.template?.fetchOptions?.index,
    dateField: task.template?.fetchOptions?.dateField,
    filters: migrateFilters(task.template?.fetchOptions?.filters),
    inserts: migrateLayouts(task.template?.inserts),
  },
}));

/**
 * Migrate presets to 2.0.0's format
 */
const migratePresets = (presets: any[]) => presets.map((preset: any) => ({
  ...preset,
  template: undefined,
  templateId: preset.template.id,
}));

/**
 * Migrate data to 2.0.0's format
 *
 * @param data The data to migrate
 *
 * @returns Migrated data
 */
const migrate = async (data: MigrationData) => ({
  ...data,
  templates: migrateTemplates(data.templates),
  taskPresets: migratePresets(data.taskPresets),
  tasks: migrateTasks(data.tasks),
});

export default {
  migrate,
  name,
};
