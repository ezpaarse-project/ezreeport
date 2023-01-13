<template>
  <Story group="cron">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <ezr-cron-list />
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
          <ezr-cron-list />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { isCollecting } from 'histoire/client';
import { onMounted } from 'vue';
import { useEzReeport } from '~/index';

const $ezReeport = useEzReeport();

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
