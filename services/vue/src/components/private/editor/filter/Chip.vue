<template>
  <v-chip
    :color="props.modelValue.isNot ? 'red' : 'blue'"
    :closable="props.closable"
    density="compact"
    class="mr-2"
    @click="emit('click', $event)"
    @click:close="emit('click:close', $event)"
  >
    <span class="value-chip">{{ props.modelValue.name }}</span>
  </v-chip>
</template>

<script setup lang="ts">
import type { TemplateFilter } from '~sdk/helpers/filters';

// Components props
const props = defineProps<{
  /** The filter to display */
  modelValue: TemplateFilter,
  /** Should the chip closable */
  closable?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Click on a chip */
  (e: 'click', ev: MouseEvent | KeyboardEvent): void
  /** Click on the close button of a chip */
  (e: 'click:close', ev: MouseEvent): void
}>();
</script>

<style scoped>
.value-chip {
  display: inline-block;
  vertical-align: bottom;
  max-width: 15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
