<template>
  <div class="template-layout-preview-container">
    <div v-if="$slots.prepend" class="d-flex flex-column align-center">
      <slot name="prepend" />
    </div>

    <v-sheet
      :color="current ? 'primary' : undefined"
      :border="!current"
      rounded
      class="template-layout-preview"
    >
      <v-fade-transition tag="div" group class="template-layout-preview-grid" :disabled="dragging">
        <EditorPreviewSlot
          v-for="figure in modelValue.figures"
          :key="figure.id"
          :model-value="figure"
        />
      </v-fade-transition>

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
import { state } from '@formkit/drag-and-drop';
import type { AnyLayoutHelper } from '~sdk/helpers/layouts';

// Components props
defineProps<{
  /** The layout to edit */
  modelValue: AnyLayoutHelper,
  /** Is currently selected */
  current?: boolean,
}>();

const { grid } = useTemplateEditor();

const dragging = ref(false);

state.on('dragStarted', () => {
  dragging.value = true;
});

state.on('dragEnded', () => {
  dragging.value = false;
});
</script>

<style lang="scss" scoped>
.template-layout-preview {
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

  &-grid {
    display: grid;
    grid-template-columns: repeat(v-bind('grid.cols'), 1fr);
    grid-template-rows: repeat(v-bind('grid.rows'), 1fr);
    gap: 0.25rem;

    height: 100%;
  }
}
</style>
