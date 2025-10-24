<template>
  <v-row>
    <v-col>
      <v-textarea
        v-model="value"
        :label="$t('$ezreeport.editor.aggregation.raw')"
        :error-messages="parseError?.message"
        :readonly="readonly"
        :disabled="disabled"
        prepend-icon="mdi-cursor-text"
        variant="outlined"
        required
        @update:model-value="hasChanged = true"
      />

      <v-text-field
        ref="rulesRef"
        :rules="[
          () => !hasChanged || 'Changed',
          () => !parseError || 'Parse error',
        ]"
        class="d-none"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { FigureRawAggregation } from '~sdk/helpers/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue: FigureRawAggregation;
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Component events
const emit = defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: FigureRawAggregation): void;
}>();

const rulesRef = useTemplateRef('rulesRef');

/** Value (and other meta) of the raw aggregation in text format */
const { value, hasChanged, parseError, onChange } = useJSONRef(
  () => props.modelValue.raw ?? {}
);

/**
 * Update raw aggregation when value changes
 */
onChange((raw) => emit('update:modelValue', { raw }));

watch(hasChanged, () => rulesRef.value?.validate());
</script>
