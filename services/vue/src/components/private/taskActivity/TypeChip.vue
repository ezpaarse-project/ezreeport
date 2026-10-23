<template>
  <v-chip
    :text="modelValue.type"
    size="small"
    variant="outlined"
    v-bind="chip"
  />
</template>

<script setup lang="ts">
  import type { TaskActivity } from '~sdk/task-activity';
  import {
    mdiEmailMinus,
    mdiFileDocumentCheck,
    mdiFileDocumentRemove,
    mdiPencil,
    mdiPlus,
  } from '@mdi/js';

  // Components props
  const props = defineProps<{
    /** The tag to show */
    modelValue: TaskActivity;
  }>();

  const chip = computed(() => {
    switch (props.modelValue.type) {
      case 'creation':
        return { color: 'green', prependIcon: mdiPlus };
      case 'edition':
        return { color: 'blue', prependIcon: mdiPencil };
      case 'task:unsubscribe':
        return { color: 'orange', prependIcon: mdiEmailMinus };
      // Legacy
      case 'generation-success':
      case 'generation:success':
        return { color: 'green', prependIcon: mdiFileDocumentCheck };
      case 'generation-error': // Legacy
      case 'generation:error':
        return { color: 'red', prependIcon: mdiFileDocumentRemove };
      default:
        return {};
    }
  });
</script>
