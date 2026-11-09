<template>
  <v-autocomplete
    ref="autocomplete"
    v-model="modelValue"
    :label="$t('$ezreeport.editor.aggregation.type')"
    :rules="[
      (val) => allowedType !== 'bucket' || !!val || $t('$ezreeport.required'),
    ]"
    :items="typeOptions"
    :readonly="readonly"
    :disabled="disabled"
    :prepend-icon="mdiSelectGroup"
    variant="underlined"
    hide-details="auto"
  />
</template>

<script setup lang="ts">
  import { mdiSelectGroup } from '@mdi/js';
  import {
    type AggregationType,
    aggregationTypes,
  } from '~sdk/helpers/aggregations';

  import type { InnerBaseAggregation } from '~/lib/aggregations';

  /** Aggregation type to edit */
  const modelValue = defineModel<InnerBaseAggregation['type']>({
    required: true,
  });

  // Component props
  const props = defineProps<{
    /** Should be disabled */
    disabled?: boolean;
    /** Should be readonly */
    readonly?: boolean;
    /** Types of aggregations allowed in options */
    allowedType?: AggregationType;
  }>();

  // Utils composables
  const { t } = useI18n();

  const autocomplete = useTemplateRef('autocomplete');

  function aggTypeToListItem(
    value: (typeof aggregationTypes)[number][],
    isCommonlyFound: boolean
  ): unknown[] {
    const items: unknown[] = [
      // There's no way to add "headers", "groups" or "children" into a
      // VSelect (and other derivate), so headers are items with custom style
      {
        props: {
          disabled: true,
        },
        title: t(
          `$ezreeport.editor.aggregation.typeGroups.${isCommonlyFound ? 'common' : 'others'}`
        ),
        value: isCommonlyFound,
      },
    ];

    // Add count metric type
    if (
      isCommonlyFound &&
      (!props.allowedType || props.allowedType === 'metric')
    ) {
      items.push({
        props: {
          style: {
            paddingLeft: '2rem',
          },
        },
        title: t('$ezreeport.editor.aggregation.types._count'),
        value: '',
      });
    }

    return [
      ...items,
      // Map items
      ...value.map((type) => ({
        props: {
          style: {
            paddingLeft: '2rem',
          },
          subtitle: type.name,
        },
        title: t(`$ezreeport.editor.aggregation.types.${type.name}`),
        value: type.name,
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
      [...grouped]
        // Put common in first
        .toSorted(([nameA], [nameB]) => Number(nameB) - Number(nameA))
        .flatMap(([isCommonlyFound, value]) =>
          aggTypeToListItem(value, isCommonlyFound)
        )
    );
  });

  onMounted(() => {
    autocomplete.value?.validate();
  });
</script>
