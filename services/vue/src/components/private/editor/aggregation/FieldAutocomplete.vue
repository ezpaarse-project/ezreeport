<template>
  <v-combobox
    :model-value="modelValue"
    :label="$t('$ezreeport.editor.aggregation.field')"
    :items="fieldOptions"
    :rules="[(val) => !!val || t('$ezreeport.required')]"
    :readonly="readonly"
    :disabled="disabled"
    :return-object="false"
    prepend-icon="mdi-form-textbox"
    variant="underlined"
    required
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import {
  type InnerBaseAggregation,
  aggregationFieldTypes,
} from '~/lib/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue: string;
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregation */
  type?: InnerBaseAggregation['type'];
}>();

// Component events
defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: string): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();
const { getOptionsFromMapping } = useTemplateEditor();

/** Type of fields needed for the current aggregation */
const fieldTypes = computed(
  () => props.type && aggregationFieldTypes.get(props.type)
);

/** Options for the field, based on current mapping */
const fieldOptions = computed(() =>
  getOptionsFromMapping(fieldTypes.value, { dateField: true })
);
</script>
