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

const innerFormat = computed(() => props.format || 'dd/MM/yyyy');

const date = computed(() => dFormat(props.value, innerFormat.value));
</script>

<style scoped>

</style>
