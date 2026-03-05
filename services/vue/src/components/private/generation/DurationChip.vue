<template>
  <v-chip
    v-if="took > 0"
    variant="outlined"
    size="small"
    prepend-icon="mdi-timer"
  >
    {{ formatted }}
  </v-chip>
</template>

<script setup lang="ts">
  import type { Generation } from '~sdk/generations';
  import { formatDuration } from 'date-fns';

  const props = defineProps<{
    modelValue: Generation;
  }>();

  // Utils composables
  const { locale } = useDateLocale();

  const took = computed(() => props.modelValue.took ?? 0);

  const formatted = computed(() =>
    formatDuration({ seconds: took.value / 1000 }, { locale: locale.value })
  );
</script>
