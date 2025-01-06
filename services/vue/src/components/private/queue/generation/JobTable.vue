<template>
  <v-data-table-server
    :headers="headers"
    v-bind="vDataTableOptions"
    item-value="id"
  >
    <template #top>
      <v-toolbar
        :title="$t('$ezreeport.queues._.title:jobs', total)"
        color="transparent"
        density="compact"
      >
        <template #append>
          <v-btn
            v-tooltip:top="$t('$ezreeport.refresh')"
            :loading="loading"
            variant="tonal"
            color="primary"
            icon="mdi-refresh"
            density="comfortable"
            class="ml-2"
            @click="refresh"
          />
        </template>
      </v-toolbar>
    </template>

    <template #[`item.data.task.name`]="{ value, item }">
      <v-icon
        v-if="!item.data.shouldWriteActivity"
        v-tooltip:top="$t('$ezreeport.queues.generation.debug')"
        icon="mdi-bug-outline"
        start
      />

      {{ value }}
    </template>

    <template #[`item._namespace`]="{ item }">
      {{ namespaceMap.get(item.data.task.namespaceId) || item.data.task.namespaceId }}
    </template>

    <template #[`item.status`]="{ value }">
      <QueueJobStatusIcon :model-value="value" />
    </template>

    <template #[`item.result.success`]="{ value }">
      <QueueJobStatusIcon
        v-if="value != null"
        :model-value="value ? 'completed' : 'failed'"
      />
    </template>

    <template #[`item.started`]="{ value }">
      <LocalDate v-if="value" :model-value="value" format="PPPpp" />
    </template>

    <template #[`item._duration`]="{ item }">
      <QueueJobDurationChip v-if="item.started" :start="item.started" :end="item.ended" />
    </template>

    <template #[`item._actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            icon="mdi-cog"
            variant="plain"
            density="comfortable"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.restart')"
            :disabled="!availableActions.retry || (item.status !== 'completed' && item.status !== 'failed')"
            prepend-icon="mdi-restart"
            @click="restartJob(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.queues._.info')"
            prepend-icon="mdi-information"
            @click="openInfo(item)"
          />
        </v-list>
      </v-menu>
    </template>
  </v-data-table-server>

  <v-dialog
    v-model="isInfoOpen"
    width="75%"
    scrollable
  >
    <template #default>
      <QueueGenerationJobCard v-if="selectedJob" :model-value="selectedJob">
        <template #actions>
          <v-btn
            :text="$t('$ezreeport.restart')"
            :disabled="!availableActions.retry || (selectedJob.status !== 'completed' && selectedJob.status !== 'failed')"
            prepend-icon="mdi-restart"
            color="orange"
            @click="restartJob(selectedJob)"
          />

          <v-spacer />

          <v-btn :text="$t('$ezreeport.close')" @click="isInfoOpen = false" />
        </template>
      </QueueGenerationJobCard>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import type { VDataTable } from 'vuetify/components';

import { hasPermission } from '~sdk/helpers/permissions';
import { getCurrentNamespaces } from '~sdk/auth';
import { retryJob } from '~sdk/queues';
import {
  getGenerationJob,
  getGenerationJobs,
  type GenerationJob,
  type GenerationJobWithResult,
} from '~sdk/helpers/jobs';

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

// Utils composable
const { t } = useI18n();

/** Map between namespaceId and namespace's name */
const namespaceMap = ref(new Map<string, string>());
/** Is info opened */
const isInfoOpen = ref(false);
/** Selected job */
const selectedJob = ref<GenerationJobWithResult | undefined>();

/** List of jobs */
const {
  total,
  refresh: refreshJobs,
  loading,
  vDataTableOptions,
} = useServerSidePagination(
  (params) => getGenerationJobs(params),
  { order: 'desc', immediate: false },
);

const availableActions = computed(() => ({
  retry: hasPermission(retryJob),
}));

const headers = computed((): VDataTableHeaders => [
  {
    title: t('$ezreeport.queues.generation.task'),
    value: 'data.task.name',
  },
  {
    title: t('$ezreeport.namespace'),
    value: '_namespace',
  },
  {
    title: t('$ezreeport.queues.generation.origin'),
    value: 'data.origin',
  },
  {
    title: t('$ezreeport.queues._.status'),
    value: 'status',
    align: 'center',
  },
  {
    title: t('$ezreeport.queues.generation.status'),
    value: 'result.success',
    align: 'center',
  },
  {
    title: t('$ezreeport.queues._.tries'),
    value: 'attempts',
    align: 'center',
  },
  {
    title: t('$ezreeport.queues._.duration'),
    value: '_duration',
    align: 'center',
  },
  {
    title: t('$ezreeport.queues._.started'),
    value: 'started',
  },
  {
    title: t('$ezreeport.actions'),
    value: '_actions',
  },
]);

async function refreshNamespaces() {
  try {
    const namespaces = await getCurrentNamespaces();
    namespaceMap.value = new Map(namespaces.map((n) => [n.id, n.name]));
  } catch (e) {
    handleEzrError(t('$ezreeport.errors.refreshNamespaces'), e);
  }
}

async function restartJob(job: GenerationJob) {
  try {
    await retryJob('generation', job);
    refreshJobs();
  } catch (e) {
    handleEzrError(t('$ezreeport.queues._.errors.retry'), e);
  }
}

async function openInfo(job: GenerationJob) {
  try {
    const fullJob = await getGenerationJob(job);
    selectedJob.value = fullJob;

    isInfoOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.queues._.errors.info'), e);
  }
}

async function refresh() {
  await Promise.allSettled([
    refreshNamespaces(),
    refreshJobs(),
  ]);
}
refresh();
</script>
