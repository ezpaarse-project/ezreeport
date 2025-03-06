<template>
  <v-card
    :title="$t('$ezreeport.editor.figures.vega._.title', { type: $t(`$ezreeport.editor.figures._.types.${modelValue.type}`) })"
    :prepend-icon="cardIcon"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <EditorFigureTitleField v-model="title" :readonly="readonly" />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <EditorFilterList :model-value="modelValue.filters" :readonly="readonly" />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card variant="outlined">
            <v-tabs v-model="tab" grow>
              <v-tab
                v-for="tab in tabs"
                :key="tab.value"
                :text="tab.text"
                :prepend-icon="tab.icon"
                :value="tab.value"
              />
            </v-tabs>

            <v-card-text>
              <v-tabs-window v-model="tab">
                <v-tabs-window-item value="value">
                  <EditorFigureVegaValue
                    v-model="value"
                    :type="modelValue.type"
                    :readonly="readonly"
                  />
                </v-tabs-window-item>

                <v-tabs-window-item value="label">
                  <EditorFigureVegaLabel
                    v-model="label"
                    :type="modelValue.type"
                    :readonly="readonly"
                  />
                </v-tabs-window-item>

                <v-tabs-window-item value="color">
                  <EditorFigureVegaColor
                    v-model="color"
                    :type="modelValue.type"
                    :readonly="readonly"
                  />
                </v-tabs-window-item>

                <v-tabs-window-item value="dataLabel">
                  <EditorFigureVegaDataLabel
                    v-model="dataLabel"
                    :type="modelValue.type"
                    :readonly="readonly"
                  />
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="modelValue.type === 'bar'">
        <v-col>
          <v-checkbox
            v-model="invertAxis"
            :label="$t('$ezreeport.editor.figures.vega.bar.invertAxis')"
            prepend-icon="mdi-rotate-left-variant"
            color="primary"
            hide-details
          />
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { VegaFigureHelper } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The vega figure to edit */
  modelValue: VegaFigureHelper,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (e: 'update:modelValue', value: VegaFigureHelper): void
}>();

// Utils composables
const { t } = useI18n();

const tab = ref(0);

/** Icon of the card */
const cardIcon = computed(() => figureIcons.get(props.modelValue.type));
/** Tabs */
const tabs = computed(() => {
  const { type } = props.modelValue;

  const valueTab = { value: 'value', text: t('$ezreeport.editor.figures.vega._.value'), icon: 'mdi-database' };
  const labelTab = { value: 'label', text: t('$ezreeport.editor.figures.vega._.label'), icon: 'mdi-label' };
  const colorTab = { value: 'color', text: t('$ezreeport.editor.figures.vega._.color'), icon: 'mdi-format-list-group' };
  const dataLabelTab = { value: 'dataLabel', text: t('$ezreeport.editor.figures.vega._.dataLabel'), icon: 'mdi-tag-text' };

  switch (type) {
    case 'arc':
      return [
        valueTab,
        { ...labelTab, text: t('$ezreeport.editor.figures.vega.arc.label'), icon: 'mdi-circle-slice-3' },
        dataLabelTab,
      ];
    case 'bar': {
      const valueAxisKey = props.modelValue.params.invertAxis ? 'label' : 'value';
      const valueAxisText = t(`$ezreeport.editor.figures.vega.bar.${valueAxisKey}`);
      const valueAxisIcon = props.modelValue.params.invertAxis ? 'mdi-arrow-right-thin' : 'mdi-arrow-up-thin';

      const labelAxisKey = props.modelValue.params.invertAxis ? 'value' : 'label';
      const labelAxisIcon = props.modelValue.params.invertAxis ? 'mdi-arrow-up-thin' : 'mdi-arrow-right-thin';
      return [
        { ...valueTab, text: valueAxisText, icon: valueAxisIcon },
        { ...labelTab, text: t(`$ezreeport.editor.figures.vega.bar.${labelAxisKey}`), icon: labelAxisIcon },
        { ...colorTab, text: t('$ezreeport.editor.figures.vega.bar.color', { axis: valueAxisText }), icon: 'mdi-chart-bar-stacked' },
        dataLabelTab,
      ];
    }
    case 'line':
    case 'area':
      return [
        valueTab,
        labelTab,
        { ...colorTab, text: t('$ezreeport.editor.figures.vega.line.color') },
      ];

    default:
      return [valueTab, labelTab, colorTab, dataLabelTab];
  }
});
/** The figure title */
const title = computed<string>({
  get: () => props.modelValue.params.title,
  set: (data) => {
    const { params } = props.modelValue;
    params.title = data;
    emit('update:modelValue', props.modelValue);
  },
});
/** The figure's value layer */
const value = computed({
  get: () => props.modelValue.params.value,
  set: (data) => {
    const { params } = props.modelValue;
    params.value = data;
    emit('update:modelValue', props.modelValue);
  },
});
/** The figure's label layer */
const label = computed({
  get: () => props.modelValue.params.label,
  set: (data) => {
    const { params } = props.modelValue;
    params.label = data;
    emit('update:modelValue', props.modelValue);
  },
});
/** The figure's color layer */
const color = computed({
  get: () => props.modelValue.params.color,
  set: (data) => {
    const { params } = props.modelValue;
    params.color = data;
    emit('update:modelValue', props.modelValue);
  },
});
/** The figure's datalabel params */
const dataLabel = computed({
  get: () => props.modelValue.params.dataLabel,
  set: (data) => {
    const { params } = props.modelValue;
    params.dataLabel = data;
    emit('update:modelValue', props.modelValue);
  },
});
/** If the figure should invert axis */
const invertAxis = computed({
  get: () => props.modelValue.params.invertAxis,
  set: (data) => {
    const { params } = props.modelValue;
    params.invertAxis = data;
    emit('update:modelValue', props.modelValue);
  },
});
</script>
