<template>
  <v-row>
    <v-col cols="12">
      <EditorAggregationTypeAutocomplete
        v-model="aggType"
        :disabled="disabled"
        :readonly="readonly"
        :allowed-type="allowedType"
      />
    </v-col>

    <v-slide-y-transition>
      <v-col v-if="modelValue?.type" cols="12">
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
        v-if="
          modelValue &&
          isMetric === false &&
          modelValue.type !== 'date_histogram'
        "
      >
        <v-col cols="12">
          <v-text-field
            v-model="currentSize"
            :label="$t('$ezreeport.editor.aggregation.size')"
            :readonly="readonly"
            :disabled="disabled"
            type="number"
            :prepend-icon="mdiImageSizeSelectSmall"
            variant="underlined"
            hide-details
          />
        </v-col>

        <v-col cols="6">
          <v-switch
            v-model="showMissing"
            :label="$t('$ezreeport.editor.aggregation.missing:show')"
            :readonly="readonly"
            :prepend-icon="mdiProgressQuestion"
            color="primary"
            hide-details
          />
        </v-col>

        <v-col cols="6">
          <v-slide-x-transition>
            <v-text-field
              v-if="modelValue && showMissing"
              v-model="modelValue.missing"
              :label="$t('$ezreeport.editor.aggregation.missing:label')"
              :readonly="readonly"
              :disabled="disabled"
              :prepend-icon="mdiTooltipQuestionOutline"
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
    mdiImageSizeSelectSmall,
    mdiProgressQuestion,
    mdiTooltipQuestionOutline,
  } from '@mdi/js';
  import {
    type AggregationType,
    type FigureBaseAggregation,
    aggregationTypes,
  } from '~sdk/helpers/aggregations';

  const DEFAULT_AGG_SIZE = 10;

  // Component props
  /** Aggregation to edit */
  const modelValue = defineModel<FigureBaseAggregation | undefined>({
    required: true,
  });

  defineProps<{
    /** Should be disabled */
    disabled?: boolean;
    /** Should be readonly */
    readonly?: boolean;
    /** Types of aggregations allowed in options */
    allowedType?: AggregationType;
  }>();

  const aggType = computed({
    get: () => modelValue.value?.type ?? '',
    set: (type) => {
      if (type === '') {
        modelValue.value = undefined;
        return;
      }
      modelValue.value = { ...modelValue.value, field: '', type };
    },
  });
  /** Current aggregation size */
  const currentSize = computed<string>({
    get: () => `${modelValue.value?.size ?? DEFAULT_AGG_SIZE}`,
    set: (value) => {
      if (!modelValue.value) {
        return;
      }

      let size = 10;

      if (value) {
        const parsed = Math.trunc(Number(value));
        if (!Number.isNaN(parsed)) {
          size = parsed;
        }
      }

      modelValue.value.size = size;
    },
  });
  /** If we should show the missing values */
  const showMissing = computed({
    get: () => Boolean(modelValue.value?.missing),
    set: (value) => {
      if (!modelValue.value) {
        return;
      }

      modelValue.value.missing = value ? 'Missing' : undefined;
    },
  });
  /** Is the aggregation a metric one */
  const isMetric = computed(() => {
    const aggDef = aggregationTypes.find(
      ({ name }) => modelValue.value?.type === name
    );
    if (!aggDef) {
      return;
    }
    return aggDef.type === 'metric';
  });
</script>
