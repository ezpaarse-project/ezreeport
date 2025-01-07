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

const props = defineProps<{
  start: Date,
  end?: Date
}>();

// Utils composables
const { locale } = useDateLocale();

const formatted = computed(() => {
  const end = props.end ?? new Date();
  const raw = end.getTime() - props.start.getTime();
  return formatDuration({ seconds: raw / 1000 }, { locale: locale.value });
});
</script>
