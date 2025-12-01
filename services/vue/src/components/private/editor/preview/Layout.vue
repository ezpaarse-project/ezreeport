<template>
  <div class="template-layout-preview-container">
    <div
      v-if="$slots.prepend || $slots.actions"
      class="template-layout-preview-prepend--container"
    >
      <div
        :class="{
          'template-layout-preview-prepend': true,
          'text-primary': current,
        }"
      >
        <slot name="prepend" />
      </div>

      <div class="template-layout-preview-prepend--actions">
        <slot name="actions" />
      </div>
    </div>

    <v-sheet
      :color="current ? 'primary' : undefined"
      :border="!current"
      rounded
      class="template-layout-preview"
    >
      <v-fade-transition
        tag="div"
        group
        class="template-layout-preview-grid"
        :disabled="dragging"
      >
        <EditorPreviewSlot
          v-for="figure in modelValue.figures"
          :key="figure.id"
          :model-value="figure"
        />
      </v-fade-transition>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { state } from '@formkit/drag-and-drop';
import type { AnyLayoutHelper } from '~sdk/helpers/layouts';

// Components props
defineProps<{
  /** The layout to edit */
  modelValue: AnyLayoutHelper;
  /** Is currently selected */
  current?: boolean;
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

<style lang="css" scoped>
.template-layout-preview {
  position: relative;
  flex: 1;
  padding: 0.5rem;

  aspect-ratio: 297/210; /* A4 format in mm */
  cursor: pointer;

  &::before {
    content: '';
    background-color: rgba(var(--v-theme-on-surface), 0.35);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    z-index: 10;
  }

  &:hover::before {
    opacity: var(--v-theme-surface-overlay-multiplier);
  }
}

.template-layout-preview-container {
  width: 100%;
  display: flex;
  gap: 0.5rem;
}

.template-layout-preview-prepend,
.template-layout-preview-prepend--container,
.template-layout-preview-prepend--actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.template-layout-preview-prepend--actions {
  justify-content: end;
  flex: 1;
}

.template-layout-preview-grid {
  display: grid;
  grid-template-columns: repeat(v-bind('grid.cols'), 1fr);
  grid-template-rows: repeat(v-bind('grid.rows'), 1fr);
  gap: 0.25rem;

  height: 100%;
}
</style>
