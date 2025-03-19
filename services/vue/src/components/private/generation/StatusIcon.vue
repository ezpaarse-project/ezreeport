<template>
  <v-icon v-bind="iconProps" />
</template>

<script setup lang="ts">
import type { Generation } from '~sdk/generations';

const props = defineProps<{
  modelValue: Generation,
}>();

const iconProps = computed(() => {
  switch (props.modelValue.status) {
    case 'SUCCESS':
      return { icon: 'mdi-check', color: 'success' };
    case 'ERROR':
      return { icon: 'mdi-close', color: 'error' };
    case 'PROCESSING':
      return { icon: 'mdi-play', color: 'primary' };
    case 'PENDING':
      return { icon: 'mdi-clock', color: 'secondary' };
    default:
      return { icon: 'mdi-dots-horizontal', color: 'grey' };
  }
});
</script>
