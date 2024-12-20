<template>
  <v-row>
    <v-col>
      <EditorAggregationForm
        v-model="aggregation"
        :readonly="readonly"
        type="metric"
        variant="tonal"
      />
    </v-col>
  </v-row>

  <v-row v-if="type !== 'arc'">
    <v-col>
      <v-text-field
        v-model="title"
        :label="$t('$ezreeport.editor.figures.vega._.axisTitle')"
        :readonly="readonly"
        prepend-icon="mdi-axis-arrow-info"
        variant="underlined"
        hide-details
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { VegaLayer } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The vega layer to edit */
  modelValue: VegaLayer,
  /** Type of the figure */
  type: string,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated layer */
  (e: 'update:modelValue', value: VegaLayer): void
}>();

/** Layer's aggregation */
const aggregation = computed({
  get: () => props.modelValue.aggregation,
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, aggregation: value });
  },
});
/** Axis's title */
const title = computed({
  get: () => props.modelValue.title,
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, title: value });
  },
});
</script>
