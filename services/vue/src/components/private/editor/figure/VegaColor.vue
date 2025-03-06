<template>
  <v-row no-gutters>
    <v-col>
      <v-switch
        v-model="isEnabled"
        :label="enabledLabel"
        :readonly="readonly"
        density="compact"
        color="primary"
        hide-details
        class="ml-2"
      />
    </v-col>
  </v-row>

  <v-row>
    <v-col>
      <EditorAggregationForm
        v-model="aggregation"
        :disabled="!isEnabled"
        :readonly="readonly"
        type="bucket"
        variant="tonal"
      />
    </v-col>
  </v-row>

  <v-row>
    <v-col>
      <v-text-field
        v-model="title"
        :label="$t('$ezreeport.editor.figures.vega._.legend')"
        :disabled="!isEnabled"
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

// Components props
const props = defineProps<{
  /** The vega layer to edit */
  modelValue: VegaLayer | undefined,
  /** Type of the figure */
  type: string,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated layer */
  (e: 'update:modelValue', value: VegaLayer | undefined): void
}>();

// Utils composables
const { t, te } = useI18n();

/** Backup of the layer, used when enabling/disabling */
const {
  cloned: layerBackup,
  sync: syncBackup,
} = useCloned(props.modelValue ?? {}, { manual: true });

/** Label to enabling grouping */
const enabledLabel = computed(() => {
  const key = `$ezreeport.editor.figures.vega.${props.type}.color:enable`;
  if (te(key)) {
    return t(key);
  }
  return t('$ezreeport.editor.figures.vega._.color:enable');
});
/** Is grouping enabled */
const isEnabled = computed({
  get: () => props.modelValue != null,
  set: (value) => {
    if (!value) {
      syncBackup();
    }

    emit('update:modelValue', value ? layerBackup.value : undefined);
  },
});
/** Layer's aggregation */
const aggregation = computed({
  get: () => props.modelValue?.aggregation ?? layerBackup.value.aggregation,
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, aggregation: value });
  },
});
/** Group's title */
const title = computed({
  get: () => props.modelValue?.title,
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, title: value });
  },
});
</script>
