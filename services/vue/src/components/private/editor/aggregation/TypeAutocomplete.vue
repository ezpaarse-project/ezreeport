<template>
  <v-autocomplete
    :model-value="modelValue"
    :label="$t('$ezreeport.editor.aggregation.type')"
    :items="typeOptions"
    :readonly="readonly"
    :disabled="disabled"
    prepend-icon="mdi-select-group"
    variant="underlined"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import {
  type AggregationType,
  aggregationTypes,
} from '~sdk/helpers/aggregations';

import type { InnerBaseAggregation } from '~/lib/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue: InnerBaseAggregation['type'];
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregations allowed in options */
  allowedType?: AggregationType;
}>();

// Component events
defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: InnerBaseAggregation['type']): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

function aggTypeToListItem(
  value: (typeof aggregationTypes)[number][],
  isCommonlyFound: boolean
): unknown[] {
  const items: unknown[] = [
    // There's no way to add "headers", "groups" or "children" into a
    // VSelect (and other derivate), so headers are items with custom style
    {
      title: t(
        `$ezreeport.editor.aggregation.typeGroups.${isCommonlyFound ? 'common' : 'others'}`
      ),
      value: isCommonlyFound,
      props: {
        disabled: true,
      },
    },
  ];

  // Add count metric type
  if (
    isCommonlyFound &&
    (!props.allowedType || props.allowedType === 'metric')
  ) {
    items.push({
      title: t('$ezreeport.editor.aggregation.types._count'),
      value: '',
      props: {
        style: {
          paddingLeft: '2rem',
        },
      },
    });
  }

  return [
    ...items,
    // Map items
    ...value.map((type) => ({
      title: t(`$ezreeport.editor.aggregation.types.${type.name}`),
      value: type.name,
      props: {
        subtitle: type.name,
        style: {
          paddingLeft: '2rem',
        },
      },
    })),
  ];
}

/** Options for the aggregation type */
const typeOptions = computed(() => {
  let types = [...aggregationTypes];
  if (props.allowedType) {
    types = types.filter((type) => type.type === props.allowedType);
  }

  const grouped = Map.groupBy(
    types,
    (aggType) => aggType.isCommonlyFound ?? false
  );
  return (
    Array.from(grouped)
      // Put common in first
      .sort(([nameA], [nameB]) => Number(nameB) - Number(nameA))
      .flatMap(([isCommonlyFound, value]) =>
        aggTypeToListItem(value, isCommonlyFound)
      )
  );
});
</script>
