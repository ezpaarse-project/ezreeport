<template>
  <v-row>
    <v-col cols="12">
      <EditorAggregationTypeAutocomplete
        v-model="currentType"
        :disabled="disabled"
        :readonly="readonly"
        :allowed-type="allowedType"
      />
    </v-col>

    <v-slide-y-transition>
      <v-col v-if="currentType" cols="12">
        <EditorAggregationFieldAutocomplete
          v-model="currentField"
          :disabled="disabled"
          :readonly="readonly"
          :type="currentType"
        />
      </v-col>
    </v-slide-y-transition>

    <v-slide-y-transition group>
      <template v-if="isMetric === false && currentType !== 'date_histogram'">
        <v-col cols="12">
          <v-text-field
            v-model="currentSize"
            :label="$t('$ezreeport.editor.aggregation.size')"
            :readonly="readonly"
            :disabled="disabled"
            type="number"
            prepend-icon="mdi-image-size-select-small"
            variant="underlined"
            hide-details
          />
        </v-col>

        <v-col cols="6">
          <v-switch
            v-model="showMissing"
            :label="$t('$ezreeport.editor.aggregation.missing:show')"
            :readonly="readonly"
            prepend-icon="mdi-progress-question"
            color="primary"
            hide-details
          />
        </v-col>

        <v-col cols="6">
          <v-slide-x-transition>
            <v-text-field
              v-if="showMissing"
              v-model="currentMissing"
              :label="$t('$ezreeport.editor.aggregation.missing:label')"
              :readonly="readonly"
              :disabled="disabled"
              prepend-icon="mdi-tooltip-question-outline"
              variant="underlined"
              hide-details
            />
          </v-slide-x-transition>
        </v-col>
      </template>
    </v-slide-y-transition>
  </v-row>
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
  modelValue: InnerBaseAggregation;
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregations allowed in options */
  allowedType?: AggregationType;
}>();

// Component events
const emit = defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: InnerBaseAggregation): void;
}>();

/** Current aggregation type */
const currentType = computed<InnerBaseAggregation['type']>({
  get: () => props.modelValue.type ?? '',
  set: (type) => emit('update:modelValue', { ...props.modelValue, type }),
});
/** Current aggregation field */
const currentField = computed<string>({
  get: () => props.modelValue.field ?? '',
  set: (field) => emit('update:modelValue', { ...props.modelValue, field }),
});
/** Current aggregation size */
const currentSize = computed<string>({
  get: () => `${props.modelValue.size ?? 10}`,
  set: (value) => {
    let size = 10;

    if (value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        size = parsed;
      }
    }

    emit('update:modelValue', { ...props.modelValue, size });
  },
});
/** Current aggregation missing */
const currentMissing = computed<string | undefined>({
  get: () => props.modelValue.missing,
  set: (missing) => emit('update:modelValue', { ...props.modelValue, missing }),
});
/** If we should show the missing values */
const showMissing = computed({
  get: () => !!currentMissing.value,
  set: (value) =>
    emit('update:modelValue', {
      ...props.modelValue,
      missing: value ? 'Missing' : undefined,
    }),
});
/** Is the aggregation a metric one */
const isMetric = computed(() => {
  const aggDef = aggregationTypes.find(
    ({ name }) => currentType.value === name
  );
  if (!aggDef) {
    return;
  }
  return aggDef.type === 'metric';
});
</script>
