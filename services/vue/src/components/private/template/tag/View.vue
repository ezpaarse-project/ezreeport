<template>
  <div class="d-flex flex-wrap" style="gap: 0.25rem">
    <TemplateTagChip
      v-for="tag in modelValue"
      :key="tag.name"
      :model-value="tag"
      :size="size || 'small'"
    />
  </div>
</template>

<script setup lang="ts">
import type { TemplateTag } from '~sdk/helpers/templates';

defineProps<{
  modelValue: TemplateTag[];
  size?: string;
}>();
</script>
