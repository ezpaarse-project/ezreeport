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
      :icon="mdiCounter"
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
  import {
    mdiCounter,
    mdiFormatAlignBottom,
    mdiFormatAlignCenter,
    mdiFormatAlignJustify,
    mdiFormatAlignRight,
    mdiFormatAlignTop,
    mdiFormatBold,
    mdiFormatColorFill,
    mdiFormatColorText,
    mdiFormatItalic,
    mdiFormatSize,
    mdiSelectColor,
  } from '@mdi/js';

  // Components props
  const props = defineProps<{
    /** The column to display */
    modelValue: TableColumn;
  }>();

  // Util composables
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
      [mdiFormatColorFill]: {
        show: Boolean(styles.fillColor),
        style: { color: fillColor },
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.fillColor'),
      },
      [mdiFormatColorText]: {
        show: Boolean(styles.textColor),
        style: { color: textColor },
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.textColor'),
      },
      [mdiSelectColor]: {
        show: Boolean(styles.lineColor),
        style: { color: lineColor },
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.lineColor'),
      },
      // Font
      [mdiFormatSize]: {
        show: Boolean(styles.fontSize),
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.fontSize'),
      },
      [mdiFormatBold]: {
        show: styles.fontStyle === 'bold' || styles.fontStyle === 'bolditalic',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.bold'),
      },
      [mdiFormatItalic]: {
        show: styles.fontStyle === 'italic' || styles.fontStyle === 'bolditalic',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.italic'),
      },
      // VAlign
      [mdiFormatAlignTop]: {
        show: styles.valign === 'top',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.vtop'),
      },
      [mdiFormatAlignBottom]: {
        show: styles.valign === 'bottom',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.vbottom'),
      },
      // HAlign
      [mdiFormatAlignCenter]: {
        show: styles.halign === 'center',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.hcenter'),
      },
      [mdiFormatAlignRight]: {
        show: styles.halign === 'right',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.hright'),
      },
      [mdiFormatAlignJustify]: {
        show: styles.halign === 'justify',
        tooltip: t('$ezreeport.editor.figures.table.columns.styles.hjustify'),
      },
    };

    return Object.entries(icons).filter(([, def]) => def.show);
  });
</script>

<style lang="css" scoped>
  .table-preview--column-header,
  .table-preview--column-value {
    display: flex;
    align-items: center;
  }
</style>
