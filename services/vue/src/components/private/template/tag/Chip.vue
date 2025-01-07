<template>
  <v-chip
    :text="modelValue.name"
    :color="modelValue.color"
    density="comfortable"
    variant="flat"
    label
    :style="{ color: textColor }"
  />
</template>

<script setup lang="ts">
import chroma from 'chroma-js';

import type { TemplateTag } from '~sdk/helpers/templates';

// Components props
const props = defineProps<{
  /** The tag to show */
  modelValue: TemplateTag,
}>();

const color = computed(() => {
  if (!props.modelValue.color) {
    return undefined;
  }
  return chroma(props.modelValue.color).hex('rgb');
});

const textColor = computed(() => {
  if (!color.value) {
    return undefined;
  }
  return chroma.contrast(color.value, 'black') > 5 ? 'black' : 'white';
});
</script>
