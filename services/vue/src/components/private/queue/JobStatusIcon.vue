<template>
  <v-icon v-bind="iconProps" />
</template>

<script setup lang="ts">
import type { JobStatus } from '~sdk/queues';

const props = defineProps<{
  modelValue: JobStatus,
}>();

const iconProps = computed(() => {
  switch (props.modelValue) {
    case 'completed':
      return { icon: 'mdi-check', color: 'success' };
    case 'failed':
      return { icon: 'mdi-close', color: 'error' };
    case 'delayed':
      return { icon: 'mdi-clock', color: 'warning' };
    case 'active':
      return { icon: 'mdi-play', color: 'primary' };
    case 'waiting':
      return { icon: 'mdi-clock', color: 'secondary' };
    default:
      return { icon: 'mdi-dots-horizontal', color: 'grey' };
  }
});
</script>
