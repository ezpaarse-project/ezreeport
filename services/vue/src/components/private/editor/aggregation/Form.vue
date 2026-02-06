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
        :color="isAdvanced ? 'orange' : 'grey'"
        :variant="isAdvanced ? 'flat' : 'text'"
        :disabled="isAdvanced && !isValid"
        density="comfortable"
        icon="mdi-tools"
        @click="switchMode()"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <EditorAggregationFormFilters
          v-if="isFiltersAggregation(aggregation)"
          v-model="aggregation"
          :disabled="disabled"
          :readonly="readonly"
          :allowed-type="type"
        />

        <EditorAggregationFormBasic
          v-else-if="isBaseAggregation(aggregation)"
          v-model="aggregation"
          :disabled="disabled"
          :readonly="readonly"
          :allowed-type="type"
        />

        <EditorAggregationFormRaw
          v-else-if="isRawAggregation(aggregation)"
          v-model="aggregation"
          :disabled="disabled"
          :readonly="readonly"
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
} from '~sdk/helpers/aggregations';

import {
  isBaseAggregation,
  isFiltersAggregation,
  isRawAggregation,
  type InnerAggregation,
} from '~/lib/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue?: FigureAggregation | undefined;
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregations allowed in options */
  type?: AggregationType;
}>();

// Component events
const emit = defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: FigureAggregation | undefined): void;
}>();

/** Is form valid */
const isValid = ref(false);

/** Aggregation to edit */
const { cloned: aggregation } = useCloned<InnerAggregation | null>(
  props.modelValue ?? null
);
/** Backup of the aggregation in the last mode (simple/advanced) */
const { cloned: aggregationBackup, sync: syncBackup } = useCloned(aggregation, {
  manual: true,
});

/** Ref to VForm + validate on mount */
const vform = useTemplateVForm('formRef', { immediate: !!props.modelValue });

/** Is the aggregation in advanced mode */
const isAdvanced = computed(() => isRawAggregation(aggregation.value));

/**
 * Switch between advanced and simple mode, also restore the backup
 */
function switchMode(): void {
  let newAggregation;
  if (isAdvanced.value) {
    newAggregation = {
      type: '',
      field: '',
      ...aggregationBackup.value,
      raw: undefined,
    };
  } else {
    newAggregation = {
      raw: {},
      ...aggregationBackup.value,
      type: undefined,
      field: undefined,
    };
  }
  syncBackup();
  aggregation.value = newAggregation as InnerAggregation;
}

/**
 * Update modelValue when aggregation changes
 */
watch(
  aggregation,
  () => {
    vform.value?.validate();
    emit(
      'update:modelValue',
      (aggregation.value ?? undefined) as FigureAggregation | undefined
    );
  },
  { deep: true }
);
</script>
