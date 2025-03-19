<template>
  <v-chip
    variant="outlined"
    size="small"
    prepend-icon="mdi-timer"
  >
    {{ formatted }}
  </v-chip>
</template>

<script setup lang="ts">
import { formatDuration } from 'date-fns';
import type { Generation } from '~sdk/generations';

const props = defineProps<{
  modelValue: Generation
}>();

// Utils composables
const { locale } = useDateLocale();

const formatted = computed(() => formatDuration(
  { seconds: props.modelValue.took / 1000 },
  { locale: locale.value },
));
</script>
