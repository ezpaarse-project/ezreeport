<template>
  <Story group="health">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <ezReeportStatus :mock="{ data }" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <ezReeportStatus :mock="{ data }" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Error"
      icon="material-symbols:error-outline"
    >
      <v-app style="background: transparent">
        <ezReeportStatus :mock="{ data, error: 'A mock error occurred' }" />
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <ezReeportStatus :mock="{ data, loading: true }" />
      </v-app>
    </Variant>

    <Variant
      title="Live data"
      icon="material-symbols:cloud-outline"
    >
      <v-app style="background: transparent">
        <ezReeportStatus />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { setup, type health } from 'ezreeport-sdk-js';
import { isCollecting } from 'histoire/client';

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

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    setup.setURL(import.meta.env.VITE_REPORT_API);
  }
});
</script>

<docs lang="md">
# ezReeportStatus

Shows status of services connected to the reporting.

You can hover each status to get more info about them (like time of response & status code).
</docs>
