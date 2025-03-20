<template>
  <v-data-table-server
    :headers="headers"
    item-value="id"
    v-bind="vDataTableOptions"
  >
    <template #top>
      <v-toolbar
        :title="$t('$ezreeport.generations.title', total)"
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

    <template #[`item.task.name`]="{ value, item }">
      {{ value }}
      <TemplateTagView v-if="item.task?.extends?.tags" :model-value="item.task.extends.tags" size="x-small" />
    </template>

    <template #[`item.task.namespace`]="{ value, item }">
      <slot name="item.task.namespace" :namespace="value" :task="item">
        {{ value.name }}
      </slot>
    </template>

    <template #[`item._period`]="{ item }">
      <LocalDate :model-value="item.start" format="P" />
      ~
      <LocalDate :model-value="item.end" format="P" />
    </template>

    <template #[`item.status`]="{ item }">
      <GenerationStatusIcon :model-value="item" />
    </template>

    <template #[`item.progress`]="{ value, item }">
      <v-progress-linear
        v-tooltip="{ text: `${value}%`, disabled: value == null }"
        :model-value="value ?? 0"
        :indeterminate="value == null"
        :color="statusColors.get(item.status) ?? 'primary'"
        height="8"
        rounded
      />
    </template>

    <template #[`item.took`]="{ item }">
      <GenerationDurationChip :model-value="item" />
    </template>

    <template #[`item.createdAt`]="{ value }">
      <LocalDate v-if="value" :model-value="value" format="PPPpp" />
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
            :disabled="!availableActions.retry || !isGenerationEnded(item)"
            prepend-icon="mdi-restart"
            @click="restartGen(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.generations.info')"
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
      <GenerationCard v-if="selectedGeneration" :model-value="selectedGeneration">
        <template #actions>
          <v-btn
            :text="$t('$ezreeport.restart')"
            :disabled="!availableActions.retry || !isGenerationEnded(selectedGeneration)"
            prepend-icon="mdi-restart"
            color="orange"
            @click="restartGen(selectedGeneration)"
          />
          <v-spacer />

          <v-btn :text="$t('$ezreeport.close')" @click="isInfoOpen = false" />
        </template>
      </GenerationCard>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import type { VDataTable } from 'vuetify/components';

import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import { isGenerationEnded, listenAllGenerations } from '~sdk/helpers/generations';
import {
  getAllGenerations,
  getGeneration,
  restartGeneration,
  type GenerationStatus,
  type Generation,
} from '~sdk/generations';

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

const statusColors: Map<GenerationStatus, string> = new Map([
  ['PENDING', 'grey'],
  ['SUCCESS', 'success'],
  ['ERROR', 'error'],
]);

// Utils composable
const { t } = useI18n();

const arePermissionsReady = ref(false);
/** Is info opened */
const isInfoOpen = ref(false);
/** Selected generation */
const selectedGeneration = ref<Generation | undefined>();

/** List of generations */
const {
  items: generations,
  total,
  refresh,
  loading,
  vDataTableOptions,
} = useServerSidePagination(
  (params) => getAllGenerations(params),
  { sortBy: 'createdAt', order: 'desc', include: ['task.namespace', 'task.extends.tags'] },
);

// Listen and update generations
const { stop: stopListening } = listenAllGenerations((generation) => {
  const index = generations.value.findIndex(({ id }) => id === generation.id);
  if (index < 0) {
    refresh();
    return;
  }
  const { task } = generations.value[index];
  generations.value[index] = { ...generation, task };

  if (selectedGeneration.value?.id === generation.id) {
    selectedGeneration.value = { ...generation, task };
  }
});

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    retry: hasPermission(restartGeneration),
  };
});

const headers = computed((): VDataTableHeaders => [
  {
    title: t('$ezreeport.generations.task'),
    value: 'task.name',
  },
  {
    title: t('$ezreeport.namespace'),
    value: 'task.namespace.name',
  },
  {
    title: t('$ezreeport.generations.origin'),
    value: 'origin',
    sortable: true,
  },
  {
    title: t('$ezreeport.generations.period'),
    value: '_period',
    align: 'center',
  },
  {
    title: t('$ezreeport.generations.status'),
    value: 'status',
    align: 'center',
    sortable: true,
  },
  {
    title: t('$ezreeport.generations.progress'),
    value: 'progress',
    align: 'center',
    sortable: true,
  },
  {
    title: t('$ezreeport.generations.duration'),
    value: 'took',
    align: 'center',
    sortable: true,
  },
  {
    title: t('$ezreeport.generations.started'),
    value: 'createdAt',
    sortable: true,
  },
  {
    title: t('$ezreeport.actions'),
    value: '_actions',
  },
]);

async function restartGen(gen: Generation) {
  try {
    await restartGeneration(gen);
  } catch (e) {
    handleEzrError(t('$ezreeport.generations.errors.retry'), e);
  }
}

async function openInfo(gen: Generation) {
  try {
    const fullJob = await getGeneration(gen);
    selectedGeneration.value = fullJob;

    isInfoOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.generations.errors.info'), e);
  }
}

refreshPermissions()
  .then(() => { arePermissionsReady.value = true; });

onUnmounted(() => {
  stopListening();
});
</script>
