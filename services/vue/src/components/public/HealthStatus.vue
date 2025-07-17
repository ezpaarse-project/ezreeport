<template>
  <v-toolbar
    :title="`${titlePrefix || ''}${$t('$ezreeport.health.title:list')}`"
    color="transparent"
    density="comfortable"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template #append>
      <v-btn
        :text="$t('$ezreeport.refresh')"
        :loading="loading"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        class="ml-2"
        @click="refresh()"
      />
    </template>
  </v-toolbar>

  <v-progress-linear :active="loading" color="primary" indeterminate />

  <v-row>
    <v-col>
      <v-list lines="two" density="compact">
        <v-list-subheader :title="$t('$ezreeport.health.client')" />

        <v-list-item title="client" :subtitle="`v${version}`" />
        <v-list-item title="sdk" :subtitle="`v${sdkVersion}`" />

        <v-list-item
          v-if="status"
          :title="status.current"
          :subtitle="`v${status.version}`"
        />
      </v-list>
    </v-col>
  </v-row>

  <template v-if="status">
    <v-divider />

    <v-row>
      <v-col>
        <v-list lines="two" density="compact">
          <v-list-subheader :title="$t('$ezreeport.health.services')" />

          <HealthServiceItem
            v-for="[key, instances] in services"
            :key="key"
            :label="key"
            :modelValue="instances"
          />
        </v-list>
      </v-col>

      <v-col>
        <v-list lines="two" density="compact">
          <v-list-subheader :title="$t('$ezreeport.health.fs')" />

          <HealthFileSystemItem
            v-for="[key, usages] in fileSystems"
            :key="key"
            :modelValue="usages"
          />
        </v-list>
      </v-col>
    </v-row>
  </template>
</template>

<script setup lang="ts">
import { version } from '~/../package.json';
import { version as sdkVersion } from '~sdk';
import { getStatus, type ApiService, type ApiStatus } from '~sdk/health';

const MINIMUM_SERVICES = [
  'rabbitmq',
  'api',
  'database',
  'worker',
  'elastic',
  'scheduler',
  'mail',
  'smtp',
  'files',
];

// Components props
defineProps<{
  titlePrefix?: string;
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

/** Is loading */
const loading = ref(false);
/** API status */
const status = ref<ApiStatus | undefined>();

const services = computed(() => {
  const minimum = MINIMUM_SERVICES.map(
    (service) => [service, []] as [string, ApiService[]]
  );
  const fromAPI = Map.groupBy(
    status.value?.services ?? [],
    ({ service }) => service
  );
  return new Map([...minimum, ...fromAPI]);
});

const fileSystems = computed(() => {
  const values = (status.value?.services ?? []).flatMap(
    ({ hostname, service, filesystems }) =>
      (filesystems ?? []).map((fs) => ({
        ...fs,
        host: { name: hostname, service },
      }))
  );

  const unsorted = Map.groupBy(values, ({ name }) => name);
  return Array.from(unsorted).sort((fsA, fsB) => fsA[0].localeCompare(fsB[0]));
});

async function refresh() {
  loading.value = true;
  try {
    status.value = await getStatus();
  } catch (err) {
    handleEzrError(t('$ezreeport.health.errors.fetch'), err);
  }
  loading.value = false;
}

useIntervalFn(refresh, 10000, { immediate: true, immediateCallback: true });
</script>
