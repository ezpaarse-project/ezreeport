<template>
  <Story
    title="internal/RecurrenceChip"
    group="task"
  >
    <template #controls>
      <HstSelect
        v-model="current"
        :options="options"
        title="Current"
      />
      <HstSelect
        v-model="size"
        :options="sizes"
        title="Size"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <RecurrenceChip
            :value="current"
            :size="size"
            class="mb-4"
          />
        </v-theme-provider>
        <HstLocale
          class="mt-4"
          direction="bottom"
        />
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <RecurrenceChip
            :value="current"
            :size="size"
            class="mb-4"
          />
        </v-theme-provider>
        <HstLocale
          class="mt-4"
          direction="bottom"
        />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { tasks } from 'ezreeport-sdk-js';
import { ref } from 'vue';
import type { Sizes } from './RecurrenceChip.vue';

const current = ref(tasks.Recurrence.DAILY);
const options = ref([
  tasks.Recurrence.DAILY,
  tasks.Recurrence.WEEKLY,
  tasks.Recurrence.MONTHLY,
  tasks.Recurrence.QUARTERLY,
  tasks.Recurrence.BIENNIAL,
  tasks.Recurrence.YEARLY,
]);
const sizes = ref<Sizes[]>([
  'x-small',
  'small',
  'normal',
  'large',
  'x-large',
]);
const size = ref<Sizes>('normal');
</script>

<docs lang="md">
# Recurrence Chip

Show task's reccurence in a styled chip
</docs>
