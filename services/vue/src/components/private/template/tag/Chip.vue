<template>
  <v-chip
    :text="modelValue.name"
    :color="modelValue.color"
    density="comfortable"
    :variant="variant"
    label
    :style="{ color: textColor }"
  />
</template>

<script setup lang="ts">
import chroma from 'chroma-js';

import type { TemplateTag, InputTemplateTag } from '~sdk/template-tags';

// Components props
const { modelValue, variant = 'flat' } = defineProps<{
  /** The tag to show */
  modelValue: TemplateTag | InputTemplateTag;
  /** The variant of the chip */
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
}>();

const color = computed(() => {
  if (!modelValue.color) {
    return;
  }
  return chroma(modelValue.color).hex('rgb');
});

const textColor = computed(() => {
  if (variant !== 'flat') {
    return color.value;
  }

  if (!color.value) {
    return;
  }
  // oxlint-disable-next-line no-named-as-default-member
  return chroma.contrast(color.value, 'black') > 5 ? 'black' : 'white';
});
</script>
