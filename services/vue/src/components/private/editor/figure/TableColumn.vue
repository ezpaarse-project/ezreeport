<template>
  <div class="table-preview--column-header">
    <slot name="prepend" />

    <b class="text-truncate">{{ modelValue.header }}</b>

    <v-spacer />

    <slot name="actions" />
  </div>

  <div class="table-preview--column-value">
    <v-icon
      v-if="modelValue.metric"
      icon="mdi-counter"
      color="grey"
      size="small"
      class="mr-1"
    />

    <div>
      <EditorAggregationSubtitle
        :model-value="modelValue.aggregation"
        :name="modelValue.header"
      />
    </div>

    <v-spacer />

    <div>
      <v-icon
        v-for="[icon, def] in styleIcons"
        :key="icon"
        v-tooltip="{
          text: def.tooltip,
          disabled: !def.tooltip,
          location: 'bottom',
        }"
        :icon="icon"
        :style="def.style"
        color="grey"
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';

import type { TableColumn } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The column to display */
  modelValue: TableColumn;
}>();

// Util composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

type IconDefinition = {
  show: boolean;
  style?: CSSProperties;
  tooltip?: string;
};

/** Icons to display, represent the column style */
const styleIcons = computed((): [string, IconDefinition][] => {
  const { styles } = props.modelValue;
  if (!styles) {
    return [];
  }

  const fillColor = Array.isArray(styles.fillColor)
    ? `rgb(${styles.fillColor.join(',')})`
    : `#${styles.fillColor}`;
  const textColor = Array.isArray(styles.textColor)
    ? `rgb(${styles.textColor.join(',')})`
    : `#${styles.textColor}`;
  const lineColor = Array.isArray(styles.lineColor)
    ? `rgb(${styles.lineColor.join(',')})`
    : `#${styles.lineColor}`;

  const icons: Record<string, IconDefinition> = {
    // Color
    'mdi-format-color-fill': {
      show: !!styles.fillColor,
      style: { color: fillColor },
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.fillColor'),
    },
    'mdi-format-color-text': {
      show: !!styles.textColor,
      style: { color: textColor },
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.textColor'),
    },
    'mdi-select-color': {
      show: !!styles.lineColor,
      style: { color: lineColor },
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.lineColor'),
    },
    // Font
    'mdi-format-size': {
      show: !!styles.fontSize,
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.fontSize'),
    },
    'mdi-format-bold': {
      show: styles.fontStyle === 'bold' || styles.fontStyle === 'bolditalic',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.bold'),
    },
    'mdi-format-italic': {
      show: styles.fontStyle === 'italic' || styles.fontStyle === 'bolditalic',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.italic'),
    },
    // VAlign
    'mdi-format-align-top': {
      show: styles.valign === 'top',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.vtop'),
    },
    'mdi-format-align-bottom': {
      show: styles.valign === 'bottom',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.vbottom'),
    },
    // HAlign
    'mdi-format-align-center': {
      show: styles.halign === 'center',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.hcenter'),
    },
    'mdi-format-align-right': {
      show: styles.halign === 'right',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.hright'),
    },
    'mdi-format-align-justify': {
      show: styles.halign === 'justify',
      tooltip: t('$ezreeport.editor.figures.table.columns.styles.hjustify'),
    },
  };

  return Object.entries(icons).filter(([, def]) => def.show);
});
</script>

<style lang="scss" scoped>
.table-preview--column {
  &-header,
  &-value {
    display: flex;
    align-items: center;
  }
}
</style>
