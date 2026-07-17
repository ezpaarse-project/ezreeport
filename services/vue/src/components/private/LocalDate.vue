<template>
  {{ formatted }}
</template>

<script setup lang="ts">
  const props = defineProps<{
    modelValue: Date;
    format?: string;
  }>();

  const { formatDate } = useDateLocale();

  const formatted = computed(() => {
    try {
      return formatDate(props.modelValue, props.format || 'PPPp');
    } catch (error) {
      return `${error}`;
    }
  });
</script>
