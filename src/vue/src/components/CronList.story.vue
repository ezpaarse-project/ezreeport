<template>
  <Story group="cron">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <ezr-cron-list :mock="{ data }" />
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
          <ezr-cron-list :mock="{ data }" />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Error"
      icon="material-symbols:error-outline"
    >
      <v-app style="background: transparent">
        <ezr-cron-list :mock="{ data, error: 'A mock error occurred' }" />
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <ezr-cron-list :mock="{ data, loading: true }" />
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Live data"
      icon="material-symbols:cloud-outline"
    >
      <v-app style="background: transparent">
        <ezr-cron-list />
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { isCollecting } from 'histoire/client';
import { type crons } from 'ezreeport-sdk-js';
import { onMounted, ref } from 'vue';
import { useEzReeport } from '~/index';

const $ezReeport = useEzReeport();

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
    $ezReeport.auth_token = import.meta.env.VITE_EZMESURE_TOKEN;
  }
});
</script>

<docs lang="md">
# Cron List

List and manage all crons.
</docs>
