<template>
  <div />
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<tasks.FullTask | undefined>,
      default: undefined,
    },
  },
  emits: {
    created(id: string) { return !!id; },
  },
});
</script>

<style scoped>

</style>
