<template>
  <Story>
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <InternalHistoryTable :history="[]" />
        </v-theme-provider>
        <HstLocale
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
          <InternalHistoryTable :history="[]" />
        </v-theme-provider>
        <HstLocale
          direction="bottom"
        />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// TODO
</script>

<docs lang="md">
# Recurrence Chip

Show task's reccurence in a styled chip
</docs>
