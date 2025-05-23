<template>
  <v-slide-x-transition
    ref="scrollerRef"
    tag="div"
    group
    class="template-layout-preview-drawer mr-1 pr-2"
  >
    <EditorPreviewLayout
      v-for="(layout, index) in items"
      :key="layout.id"
      :model-value="layout"
      :current="index === modelValue"
      :class="{ 'mb-4': true, 'template-layout-preview--readonly': layout.readonly }"
      @click="$emit('update:modelValue', index)"
    >
      <template #prepend>
        <span>{{ index + 1 }}</span>
        <v-icon v-if="layout.readonly" icon="mdi-lock" size="x-small" />
      </template>

      <template v-if="!readonly && !layout.readonly" #actions>
        <v-btn
          v-tooltip:right="$t('$ezreeport.duplicate')"
          icon="mdi-content-duplicate"
          variant="text"
          density="compact"
          size="small"
          @click.stop="$emit('click:duplicate', layout, index)"
        />
        <v-btn
          v-tooltip:right="$t('$ezreeport.delete')"
          icon="mdi-delete"
          variant="text"
          color="red"
          density="compact"
          size="small"
          @click.stop="$emit('click:delete', layout)"
        />
      </template>
    </EditorPreviewLayout>

    <v-card
      v-if="!readonly"
      variant="outlined"
      color="grey"
      class="template-layout-preview--empty"
      @click="$emit('click:create')"
    >
      <v-icon icon="mdi-plus" size="large" color="green" />
      <div>{{ $t('$ezreeport.editor.layouts.create') }}</div>
    </v-card>
  </v-slide-x-transition>
</template>

<script setup lang="ts">
import { dragAndDrop } from '@formkit/drag-and-drop/vue';

import type { AnyLayoutHelper } from '~sdk/helpers/layouts';

type DrawerLayout = (AnyLayoutHelper & { readonly?: boolean });

// Components props
const props = defineProps<{
  /** Current index */
  modelValue: number,
  /** The layouts to preview */
  items: DrawerLayout[],
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated index */
  (e: 'update:modelValue', value: number): void
  /** Updated items */
  (e: 'update:items', value: DrawerLayout[]): void
  /** Create new layout */
  (e: 'click:create'): void
  /** Duplicate layout */
  (e: 'click:duplicate', value: DrawerLayout, index: number): void
  /** Delete layout */
  (e: 'click:delete', value: DrawerLayout): void
}>();

/** Scroller of layout list */
const scrollerRef = useTemplateRef('scrollerRef');

function scrollDown() {
  const element = scrollerRef.value?.$el as HTMLDivElement | undefined;
  if (!element) {
    return;
  }

  element.scrollTop = element.scrollHeight;
}

function scrollTo(index: number) {
  const element = scrollerRef.value?.$el as HTMLDivElement | undefined;
  if (!element) {
    return;
  }

  const node = element.children[index];
  node?.scrollIntoView();
}

// Make the columns draggable to sort
if (!props.readonly) {
  dragAndDrop({
    parent: scrollerRef as unknown as Ref<HTMLElement | undefined>,
    dragPlaceholderClass: 'template-layout-preview-drawer--dragging',
    dropZone: false,
    dragImage: () => document.createElement('div'), // Disable drag image
    draggable: (el) => {
      // Disable draggable for empty items
      const isEmpty = el.classList.contains('template-layout-preview--empty');
      return !isEmpty;
    },
    values: computed({
      get: () => props.items,
      set: (value) => emit('update:items', value),
    }),
    onSort: (event) => {
      emit('update:modelValue', event.position);
    },
    onDragend: () => {
      scrollTo(props.modelValue);
    },
  });
}

defineExpose({
  scrollDown,
  scrollTo,
});
</script>

<style lang="scss" scoped>
.template-layout-preview {
  &-drawer {
    overflow-y: scroll;
    scroll-behavior: smooth;
    height: 100%;
    transition: transform 0.1s ease-in-out;

    &:deep(.template-layout-elements) {
      transition: box-shadow 0.1s ease-in-out;
    }

    &--dragging {
      background-color: white;
      transform: scale(0.8);

      &:deep(.template-layout-elements) {
        box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
      }
    }
  }

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 1rem;

    border-style: dashed;

    aspect-ratio: 297/210; // A4 format in mm
  }
}
</style>
