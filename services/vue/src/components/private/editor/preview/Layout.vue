<template>
  <div class="template-layout-preview-container">
    <slot name="prepend" />

    <v-sheet
      :color="current ? 'primary' : undefined"
      :border="!current"
      rounded
      class="template-layout-preview"
    >
      <EditorPreviewSlot
        v-for="figure in modelValue.figures"
        :key="figure.id"
        :model-value="figure"
      />

      <v-overlay
        activator="parent"
        :open-on-click="false"
        open-on-hover
        open-on-focus
        contained
        class="justify-end"
      >
        <slot name="actions" />
      </v-overlay>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import type { AnyLayoutHelper } from '~sdk/helpers/layouts';

// Components props
defineProps<{
  /** The layout to edit */
  modelValue: AnyLayoutHelper,
  /** Is currently selected */
  current?: boolean,
}>();

const { grid } = useTemplateEditor();
</script>

<style lang="scss" scoped>
.template-layout-preview {
  display: grid;
  grid-template-columns: repeat(v-bind('grid.cols'), 1fr);
  grid-template-rows: repeat(v-bind('grid.rows'), 1fr);
  gap: 0.25rem;

  position: relative;
  flex: 1;
  padding: 0.5rem;

  aspect-ratio: 297/210; // A4 format in mm
  cursor: pointer;

  &-container {
    width: 100%;
    display: flex;
    gap: 0.5rem;
  }
}
</style>
