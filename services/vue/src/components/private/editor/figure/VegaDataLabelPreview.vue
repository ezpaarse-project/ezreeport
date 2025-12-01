<template>
  <div>
    <v-label :text="$t('$ezreeport.editor.figures.vega._.dataLabel:preview')" />
  </div>

  <div class="datalabel-preview-container">
    <template v-if="modelValue">
      <div
        :class="{
          'datalabel-preview': true,
          'datalabel-preview--arc': type === 'arc',
          'datalabel-preview--in': modelValue.position !== 'out',
          'bg-primary': modelValue.position !== 'out',
        }"
      >
        <div v-if="modelValue.showLabel" class="datalabel-preview-label">
          Lorem ipsum
        </div>

        <div class="datalabel-preview-value">
          {{ exampleValue }}
          <span v-if="modelValue.format === 'percent'">%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { VegaDataLabelOptions } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The data label options to preview */
  modelValue: VegaDataLabelOptions | undefined;
  /** Type of the figure */
  type: string;
}>();

const randomValue = Math.random() * 100 + 1;

const exampleValue = computed(() =>
  Math.max(props.modelValue?.minValue || 0, randomValue).toFixed(0)
);
</script>

<style lang="css" scoped>
.datalabel-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0.5rem 0;
  height: 100%;
  background-color: transparent !important;
  transition: color 0.5s;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    top: 90%;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgb(var(--v-theme-primary));
    transition: top 0.5s;
  }
}

.datalabel-preview--in::before {
  top: 0;
}
.datalabel-preview--arc::before {
  border-radius: 100% 100% 0 0;
}

.datalabel-preview-container {
  height: 60px;
}

.datalabel-preview-value {
  font-weight: bold;
}
</style>
