<template>
  <div class="d-flex flex-wrap" style="gap: 0.25rem">
    <TemplateTagChip
      v-for="tag in modelValue"
      :key="'id' in tag ? tag.id : tag.name"
      :model-value="tag"
      :size="size || 'small'"
    />
  </div>
</template>

<script setup lang="ts">
import type { TemplateTag, InputTemplateTag } from '~sdk/template-tags';

defineProps<{
  modelValue: (TemplateTag | InputTemplateTag)[];
  size?: string;
}>();
</script>
