<template>
  <v-row>
    <v-col cols="6">
      <v-switch
        v-model="isEnabled"
        :label="$t('$ezreeport.editor.figures.vega._.dataLabel:enable')"
        :readonly="readonly"
        density="compact"
        color="primary"
        hide-details
        class="ml-2"
      />
    </v-col>

    <v-col cols="6">
      <EditorFigureVegaDataLabelPreview
        :model-value="modelValue"
        :type="type"
      />
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="6">
      <div>
        <v-label :text="$t('$ezreeport.editor.figures.vega._.dataLabel:position')" />
      </div>

      <v-btn-toggle
        v-model="position"
        :disabled="!isEnabled"
        density="comfortable"
        color="primary"
        mandatory
      >
        <v-btn
          :text="$t('$ezreeport.editor.figures.vega._.dataLabel:positions.in')"
          :readonly="readonly"
          value="in"
        />

        <v-btn
          :text="$t('$ezreeport.editor.figures.vega._.dataLabel:positions.out')"
          :readonly="readonly"
          value="out"
        />
      </v-btn-toggle>
    </v-col>

    <v-col cols="6">
      <v-checkbox
        v-model="showLabel"
        :label="$t('$ezreeport.editor.figures.vega._.dataLabel:showLabel')"
        :disabled="!isEnabled"
        :readonly="readonly"
        prepend-icon="mdi-label-multiple"
        color="primary"
        hide-details
      />
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="6">
      <v-select
        v-model="format"
        :items="formatOptions"
        :label="$t('$ezreeport.editor.figures.vega._.dataLabel:format')"
        :disabled="!isEnabled"
        :readonly="readonly"
        prepend-icon="mdi-format-paint"
        variant="underlined"
      />
    </v-col>

    <v-col cols="6">
      <v-text-field
        v-model="minValue"
        :label="$t('$ezreeport.editor.figures.vega._.dataLabel:minValue')"
        :append-inner-icon="appendIconMin"
        :max="format === 'percent' ? 100 : undefined"
        :min="format === 'percent' ? 0 : undefined"
        :disabled="!isEnabled"
        :readonly="readonly"
        type="number"
        variant="underlined"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { VegaDataLabelOptions } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The data label options to edit */
  modelValue: VegaDataLabelOptions | undefined,
  /** Type of the figure */
  type: string,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated options */
  (e: 'update:modelValue', value: VegaDataLabelOptions | undefined): void
}>();

// Utils composables
const { t } = useI18n();

/** Backup of the layer, used when enabling/disabling */
const {
  cloned: paramsBackup,
  sync: syncBackup,
} = useCloned<VegaDataLabelOptions>(props.modelValue ?? { format: 'numeric' }, { manual: true });

/** Is grouping enabled */
const isEnabled = computed({
  get: () => props.modelValue != null,
  set: (value) => {
    if (!value) {
      syncBackup();
    }

    emit('update:modelValue', value ? paramsBackup.value : undefined);
  },
});
/** Format options */
const formatOptions = computed(() => [
  {
    value: 'numeric',
    title: t('$ezreeport.editor.figures.vega._.dataLabel:formats.numeric'),
    props: {
      appendIcon: formatIcons.get('number'),
    },
  },
  {
    value: 'percent',
    title: t('$ezreeport.editor.figures.vega._.dataLabel:formats.percent'),
    props: {
      appendIcon: formatIcons.get('percent'),
    },
  },
]);
/** Format option */
const format = computed({
  get: () => props.modelValue?.format ?? paramsBackup.value.format,
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, format: value });
  },
});
/** Position option */
const position = computed({
  get: () => props.modelValue?.position ?? paramsBackup.value.position ?? 'in',
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, position: value });
  },
});
/** Should show labels */
const showLabel = computed({
  get: () => props.modelValue?.showLabel ?? paramsBackup.value.showLabel ?? false,
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, showLabel: value });
  },
});
/** Icon to append to minimum value */
const appendIconMin = computed(
  () => (format.value === 'percent' ? formatIcons.get('percent') : undefined),
);
/** Minimum value to show datalabel */
const minValue = computed({
  get: () => {
    const value = props.modelValue?.minValue ?? paramsBackup.value.minValue;
    if (value != null) {
      return `${value}`;
    }
    if (format.value === 'percent') {
      // By default it's 3 percent
      return '3';
    }
    return '';
  },
  set: (value) => {
    if (!props.modelValue) {
      return;
    }

    let number: number | undefined = Number.parseInt(value, 10);
    if (Number.isNaN(number)) {
      number = undefined;
    }

    if (number != null && format.value === 'percent') {
      if (number < 0 || number > 100) {
        return;
      }
    }

    const params = props.modelValue;
    emit('update:modelValue', { ...params, minValue: number });
  },
});
</script>
