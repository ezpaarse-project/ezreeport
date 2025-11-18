<template>
  <v-card
    :title="$t('$ezreeport.editor.figures.md.title')"
    :prepend-icon="cardIcon"
  >
    <template #append>
      <v-alert
        v-if="readonly"
        :title="$t('$ezreeport.readonly')"
        icon="mdi-lock"
        density="compact"
        class="mr-2"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <v-textarea
            :model-value="modelValue.data"
            :readonly="readonly"
            :autofocus="!readonly"
            variant="outlined"
            auto-grow
            no-resize
            hide-details
            @update:model-value="updateData($event)"
          />
        </v-col>

        <v-col>
          <div class="md-preview">
            <div v-html="renderedMD" class="md-container" />
          </div>
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
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import type { MdFigure } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The metric figure to edit */
  modelValue: MdFigure;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (event: 'update:modelValue', value: MdFigure): void;
}>();

/** Rendered markdown */
const renderedMD = ref('');

/** Icon of the card */
const cardIcon = figureIcons.get('md');

/**
 * Update the data of the figure
 *
 * @param data The new data
 */
function updateData(data: string) {
  const figure = props.modelValue;
  figure.data = data;
  emit('update:modelValue', figure);
}

/**
 * Update the preview when the data changes
 */
debouncedWatch(
  () => props.modelValue.data,
  async (data) => {
    const html = await marked(data || '', { async: true });
    renderedMD.value = DOMPurify.sanitize(html);
  },
  { immediate: true, debounce: 500 }
);
</script>

<style lang="css" scoped>
.md-content {
  & :deep(h1) {
    font-weight: normal;
    line-height: 48pt;
    font-size: 48pt;
  }
  & :deep(h2) {
    font-weight: normal;
    line-height: 24pt;
    font-size: 24pt;
  }
  & :deep(h3) {
    font-weight: normal;
    line-height: 16pt;
    font-size: 16pt;
  }
  & :deep(h4) {
    font-weight: normal;
    line-height: 12pt;
    font-size: 12pt;
  }
  & :deep(h5) {
    font-weight: normal;
    line-height: 10pt;
    font-size: 10pt;
  }
  & :deep(h6) {
    font-weight: normal;
    line-height: 6pt;
    font-size: 6pt;
  }
  & :deep(ul) {
    margin-left: 1rem;
  }
}

.md-preview {
  position: relative;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  height: 100%;
  padding: 0.5rem;
}
</style>
