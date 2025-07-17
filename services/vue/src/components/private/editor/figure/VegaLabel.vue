<template>
  <v-row>
    <v-col>
      <EditorAggregationForm
        v-model="aggregation"
        :readonly="readonly"
        type="bucket"
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

  <v-row v-if="type !== 'bar'">
    <v-col>
      <v-switch
        v-model="legendShow"
        :label="$t('$ezreeport.editor.figures.vega._.legend:enable')"
        :readonly="readonly"
        color="primary"
        hide-details
      />
    </v-col>

    <v-col v-if="type === 'arc'">
      <v-text-field
        v-model="legendTitle"
        :label="$t('$ezreeport.editor.figures.vega._.legend')"
        :disabled="!legendShow"
        :readonly="readonly"
        prepend-icon="mdi-image-text"
        variant="underlined"
        hide-details
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { VegaLayer } from '~sdk/helpers/figures';

type VegaLegend = Exclude<VegaLayer['legend'], null | undefined>;

// Components props
const props = defineProps<{
  /** The vega layer to edit */
  modelValue: VegaLayer;
  /** Type of the figure */
  type: string;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated layer */
  (event: 'update:modelValue', value: VegaLayer): void;
}>();

/** Backup of the layer, used when enabling/disabling */
const { cloned: legendBackup, sync: syncBackup } = useCloned<VegaLegend>(
  props.modelValue.legend ?? {},
  { manual: true }
);

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
/** Should show legend */
const legendShow = computed({
  get: () => !props.modelValue || props.modelValue.legend !== null,
  set: (value) => {
    if (!value) {
      syncBackup();
    }
    emit('update:modelValue', {
      ...props.modelValue,
      legend: value ? legendBackup.value : null,
    });
  },
});
/** Should show legend */
const legendTitle = computed({
  get: () => props.modelValue.legend?.title,
  set: (value) => {
    const params = props.modelValue;
    const legend = params.legend ?? {};
    emit('update:modelValue', {
      ...props.modelValue,
      legend: { ...legend, title: value },
    });
  },
});
</script>
