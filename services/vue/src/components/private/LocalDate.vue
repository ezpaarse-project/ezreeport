<template>
  {{ formatted }}
</template>

<script setup lang="ts">
import { format as formatDate } from 'date-fns';

const props = defineProps<{
  modelValue: Date,
  format?: string,
}>();

const { locale } = useDateLocale();

const formatted = computed(
  () => formatDate(props.modelValue, props.format || 'PPPp', { locale: locale.value }),
);
</script>
