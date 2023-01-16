<template>
  <Story group="health">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <ezr-status-list :mock="{ data }" />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <ezr-status-list :mock="{ data }" />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { health } from 'ezreeport-sdk-js';

const data = ref<health.PingResult[]>([
  {
    name: 'fastest-service',
    status: true,
    elapsedTime: 10,
    statusCode: 200,
  },
  {
    name: 'slow-service',
    status: true,
    elapsedTime: 500,
    statusCode: 200,
  },
  {
    name: 'error-service',
    status: false,
    error: 'mock error',
  },
]);
</script>

<docs lang="md">
# Status List

Shows status of services connected to the reporting.

You can hover each status to get more info about them (like time of response & status code).
</docs>
