<template>
  <v-chip :text="modelValue.type" size="small" variant="outlined" v-bind="chip" />
</template>

<script setup lang="ts">
import type { TaskActivity } from '~sdk/task-activity';

// Components props
const props = defineProps<{
  /** The tag to show */
  modelValue: TaskActivity,
}>();

const chip = computed(() => {
  switch (props.modelValue.type) {
    case 'creation':
      return { color: 'green', prependIcon: 'mdi-plus' };
    case 'edition':
      return { color: 'blue', prependIcon: 'mdi-pencil' };
    case 'task:unsubscribe':
      return { color: 'orange', prependIcon: 'mdi-email-minus' };
    case 'generation-success': // Legacy
    case 'generation:success':
      return { color: 'green', prependIcon: 'mdi-file-document-check' };
    case 'generation-error': // Legacy
    case 'generation:error':
      return { color: 'red', prependIcon: 'mdi-file-document-remove' };
    default:
      return {};
  }
});
</script>
