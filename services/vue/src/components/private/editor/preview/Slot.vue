<template>
  <v-sheet border class="template-layout-slot--preview">
    <v-icon :icon="typeIcon" size="large" style="opacity: 0.6" />
  </v-sheet>
</template>

<script setup lang="ts">
import { figureToGridPosition } from '~/lib/layouts';

import type { AnyFigureHelper } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The figure to preview */
  modelValue: AnyFigureHelper;
  /** Should be readonly */
}>();

const { grid } = useTemplateEditor();

/** Position in CSS grid */
const gridPosition = computed(() =>
  figureToGridPosition(props.modelValue, 0, grid.value)
);
/** Icon for current type */
const typeIcon = computed(() => figureIcons.get(props.modelValue.type));
</script>

<style lang="scss" scoped>
.template-layout-slot--preview {
  grid-column: v-bind('gridPosition.start.col + 1') /
    v-bind('gridPosition.end.col + 2');
  grid-row: v-bind('gridPosition.start.row + 1') /
    v-bind('gridPosition.end.row + 2');

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
