<template>
  <v-row>
    <v-col cols="12">
      <EditorAggregationTypeAutocomplete
        v-model="modelValue.type"
        :disabled="disabled"
        :readonly="readonly"
        :allowed-type="allowedType"
      />
    </v-col>

    <v-slide-y-transition>
      <v-col v-if="modelValue.type" cols="12">
        <EditorAggregationFieldAutocomplete
          v-model="modelValue.field"
          :disabled="disabled"
          :readonly="readonly"
          :type="modelValue.type"
        />
      </v-col>
    </v-slide-y-transition>

    <v-slide-y-transition group>
      <template
        v-if="isMetric === false && modelValue.type !== 'date_histogram'"
      >
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
              v-model="modelValue.missing"
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
/** Aggregation to edit */
const modelValue = defineModel<InnerBaseAggregation>({ required: true });

defineProps<{
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregations allowed in options */
  allowedType?: AggregationType;
}>();

/** Current aggregation size */
const currentSize = computed<string>({
  get: () => `${modelValue.value.size ?? 10}`,
  set: (value) => {
    let size = 10;

    if (value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        size = parsed;
      }
    }

    modelValue.value = { ...modelValue.value, size };
  },
});
/** If we should show the missing values */
const showMissing = computed({
  get: () => !!modelValue.value.missing,
  set: (value) => {
    modelValue.value = {
      ...modelValue.value,
      missing: value ? 'Missing' : undefined,
    };
  },
});
/** Is the aggregation a metric one */
const isMetric = computed(() => {
  const aggDef = aggregationTypes.find(
    ({ name }) => modelValue.value.type === name
  );
  if (!aggDef) {
    return;
  }
  return aggDef.type === 'metric';
});
</script>
