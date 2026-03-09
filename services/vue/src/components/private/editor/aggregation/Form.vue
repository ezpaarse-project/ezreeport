<template>
  <v-card
    :title="$t('$ezreeport.editor.aggregation.title')"
    prepend-icon="mdi-group"
    variant="outlined"
  >
    <template #append>
      <v-btn
        v-if="!readonly"
        v-tooltip="$t('$ezreeport.superUserMode')"
        :color="currentForm === 'raw' ? 'orange' : 'grey'"
        :variant="currentForm === 'raw' ? 'flat' : 'text'"
        :disabled="currentForm === 'raw' && !isValid"
        density="comfortable"
        icon="mdi-tools"
        @click="currentForm = currentForm === 'raw' ? 'basic' : 'raw'"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <EditorAggregationFormFilters
          v-if="isFiltersAggregation(modelValue)"
          v-model="modelValue"
          :disabled="disabled"
          :readonly="readonly"
          :allowed-type="type"
        />

        <EditorAggregationFormRaw
          v-else-if="isRawAggregation(modelValue)"
          v-model="modelValue"
          :disabled="disabled"
          :readonly="readonly"
        />

        <EditorAggregationFormBasic
          v-else-if="!modelValue || isBaseAggregation(modelValue)"
          v-model="modelValue"
          :disabled="disabled"
          :readonly="readonly"
          :allowed-type="type"
        />

        <slot name="text" />
      </v-form>
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import type {
    FigureAggregation,
    AggregationType,
    FigureFilterAggregation,
    FigureRawAggregation,
  } from '~sdk/helpers/aggregations';

  import {
    isBaseAggregation,
    isFiltersAggregation,
    isRawAggregation,
  } from '~/lib/aggregations';

  type AggFormsType = 'basic' | 'filters' | 'raw';

  /** Aggregation to edit */
  const modelValue = defineModel<FigureAggregation | undefined>();

  // Component props
  defineProps<{
    /** Should be disabled */
    disabled?: boolean;
    /** Should be readonly */
    readonly?: boolean;
    /** Types of aggregations allowed in options */
    type?: AggregationType;
  }>();

  /** Is form valid */
  const isValid = shallowRef(false);
  const currentForm = shallowRef<AggFormsType>('basic');

  const aggBackups = new Map<AggFormsType, FigureAggregation | undefined>();

  /** Ref to VForm + validate on mount */
  useTemplateVForm('formRef', { immediate: !!modelValue.value });

  /**
   * Change form by setting default values
   *
   * @param type - The type of the form
   * @param old - The previous type of the form
   */
  function changeForm(type: AggFormsType, old: AggFormsType): void {
    // Define default value (if creating a new figure)
    let def: FigureAggregation | undefined;
    switch (type) {
      case 'filters':
        def = { type: 'filters', values: [] } satisfies FigureFilterAggregation;
        break;
      case 'raw':
        def = { raw: {} } satisfies FigureRawAggregation;
        break;

      default:
        def = undefined;
    }

    const backup = aggBackups.get(type);
    aggBackups.set(old, modelValue.value);

    modelValue.value = backup ?? def;
  }

  /**
   * Get form type from the aggreation
   *
   * @param agg - The aggregation
   */
  function getAggFormType(agg: FigureAggregation | undefined): AggFormsType {
    if (isRawAggregation(agg)) {
      return 'raw';
    } else if (isFiltersAggregation(agg)) {
      return 'filters';
    }
    return 'basic';
  }

  // Update form type with agg type
  watch(
    modelValue,
    (agg) => {
      currentForm.value = getAggFormType(agg);
    },
    { immediate: true }
  );
  // Applis changes to form
  watch(currentForm, (type, old) => {
    changeForm(type, old);
  });
</script>
