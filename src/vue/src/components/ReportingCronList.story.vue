<template>
  <Story group="cron">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <ReportingCronList :mock="{ data }" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <ReportingCronList :mock="{ data }" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Error"
      icon="material-symbols:error-outline"
    >
      <v-app style="background: transparent">
        <ReportingCronList :mock="{ data, error: 'A mock error occurred' }" />
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <ReportingCronList :mock="{ data, loading: true }" />
      </v-app>
    </Variant>

    <Variant
      title="Live data"
      icon="material-symbols:cloud-outline"
    >
      <v-app style="background: transparent">
        <ReportingCronList />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { isCollecting } from 'histoire/client';
import { setup, type crons } from 'ezreeport-sdk-js';
import { onMounted, ref } from 'vue';

const data = ref<crons.Cron[]>([
  {
    name: 'running-cron',
    running: true,
    nextRun: new Date(),
    lastRun: new Date(),
  },
  {
    name: 'stopped-cron',
    running: false,
    lastRun: new Date(),
  },
  {
    name: 'empty-cron',
    running: false,
  },
  {
    name: 'future-cron',
    running: true,
    nextRun: new Date(),
  },
]);

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    setup.setURL(import.meta.env.VITE_REPORT_API);
    setup.login(import.meta.env.VITE_EZMESURE_TOKEN);
  }
});
</script>

<docs lang="md">
# ReportingCronList

List and manage all crons.
</docs>
