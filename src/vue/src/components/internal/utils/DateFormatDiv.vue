<template>
  <div v-bind="attrs" v-on="on">
    <slot :date="date">
      {{ date }}
    </slot>
  </div>
</template>

<script setup lang="ts">
import { format as dFormat } from 'date-fns';
import { computed } from 'vue';

const props = defineProps<{
  value: Date | number,
  format?: string,
  attrs?: any,
  on?: any
}>();

const date = computed(() => dFormat(props.value, props.format || 'dd/MM/yyyy'));
</script>

<style scoped>

</style>
