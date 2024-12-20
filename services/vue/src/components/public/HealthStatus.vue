<template>
  <v-toolbar
    :title="$t('$ezreeport.health.title:list')"
    color="transparent"
    density="compact"
  >
    <template #append>
      <v-btn
        :text="$t('$ezreeport.refresh')"
        :loading="loading"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        class="ml-2"
        @click="refresh"
      />
    </template>
  </v-toolbar>

  <v-progress-linear :active="loading" color="primary" indeterminate />

  <v-list lines="two">
    <v-list-subheader :title="$t('$ezreeport.health.client')" />

    <v-list-item title="client" :subtitle="`v${version}`" />
    <v-list-item title="sdk" :subtitle="`v${sdkVersion}`" />

    <v-list-item v-if="status" :title="status.current" :subtitle="`v${status.version}`">
      <template #append>
        <v-chip v-if="latency == null" text="KO" color="red" />
        <v-chip v-else :text="`${latency} ms`" :color="latency >= 1000 ? 'orange' : 'green'" />
      </template>
    </v-list-item>

    <v-divider />

    <v-list-subheader :title="$t('$ezreeport.health.server')" />

    <v-list-item
      v-for="pong in pongs"
      :key="pong.name"
      :title="pong.name"
    >
      <template #append>
        <v-chip v-if="pong.status" :text="`${pong.elapsedTime}ms`" :color="pong.elapsedTime >= 1000 ? 'orange' : 'green'" />
        <v-chip v-else text="KO" />
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { version } from '~/../package.json';
import { version as sdkVersion } from '~sdk';
import {
  getStatus,
  pingAllServices,
  type Pong,
  type ApiStatus,
} from '~sdk/health';

/** Is loading */
const loading = ref(false);
/** Available services */
const pongs = ref<Pong[]>([]);
/** Latency towards API in ms */
const latency = ref<number | undefined>();
/** API status */
const status = ref<ApiStatus | undefined>();

async function refresh() {
  loading.value = true;
  let ping;
  try {
    const now = Date.now();
    status.value = await getStatus();
    ping = Date.now() - now;

    pongs.value = await pingAllServices();
  } catch (e) {
    console.error(e);
  }
  latency.value = ping;
  loading.value = false;
}

refresh();
</script>
