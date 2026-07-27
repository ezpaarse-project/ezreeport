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
            :icon="mdiRefresh"
            density="comfortable"
            class="ml-2"
            @click="refresh"
          />
        </template>
      </v-toolbar>
    </template>

    <template #[`item.task.name`]="{ value, item }">
      {{ value }}
      <v-icon
        v-if="!item.writeActivity"
        v-tooltip="$t('$ezreeport.generations.debug')"
        :icon="mdiBugOutline"
      />
      <TemplateTagView
        v-if="item.task?.extends?.tags"
        :model-value="item.task.extends.tags"
        size="x-small"
      />
    </template>

    <template #[`item.origin`]="{ value }">
      <v-icon
        v-if="value === 'scheduler'"
        v-tooltip="$t('$ezreeport.generations.scheduler')"
        :icon="mdiClockOutline"
      />
      <span v-else>{{ value }}</span>
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
        v-if="item.status !== 'ABORTED'"
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
            :icon="mdiCog"
            variant="plain"
            density="comfortable"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.restart')"
            :disabled="!availableActions.retry || !isGenerationEnded(item)"
            :prepend-icon="mdiRestart"
            @click="restartGen(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.generations.info')"
            :prepend-icon="mdiInformation"
            @click="openInfo(item)"
          />
        </v-list>
      </v-menu>
    </template>
  </v-data-table-server>

  <v-dialog v-model="isInfoOpen" width="75%" scrollable>
    <template #default>
      <GenerationCard
        v-if="selectedGeneration"
        :model-value="selectedGeneration"
      >
        <template #actions>
          <v-btn
            :text="$t('$ezreeport.restart')"
            :disabled="
              !availableActions.retry || !isGenerationEnded(selectedGeneration)
            "
            :prepend-icon="mdiRestart"
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
  import {
    mdiBugOutline,
    mdiClockOutline,
    mdiCog,
    mdiInformation,
    mdiRefresh,
    mdiRestart,
  } from '@mdi/js';
  import {
    type Generation,
    type GenerationStatus,
    getAllGenerations,
    getGeneration,
    restartGeneration,
  } from '~sdk/generations';
  import {
    isGenerationEnded,
    listenAllGenerations,
  } from '~sdk/helpers/generations';

  type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

  const statusColors = new Map<GenerationStatus, string>([
    ['PENDING', 'grey'],
    ['SUCCESS', 'success'],
    ['ERROR', 'error'],
  ]);

  // Components props
  defineProps<{
    itemsPerPageOptions?: number[] | { title: string; value: number }[];
  }>();

  // Utils composable
  const { t } = useI18n();

  /** Is info opened */
  const isInfoOpen = shallowRef(false);
  /** Selected generation */
  const selectedGeneration = ref<Generation | undefined>();

  const { availableActions } = usePermissions({
    retry: [restartGeneration],
  });

  /** Items per page */
  const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
  /** List of generations */
  const {
    items: generations,
    total,
    refresh,
    loading,
    vDataTableOptions,
  } = useServerSidePagination((params) => getAllGenerations(params), {
    include: ['task.namespace', 'task.extends.tags'],
    itemsPerPage,
    order: 'desc',
    sortBy: 'createdAt',
  });

  // Listen and update generations
  const { stop: stopListening } = listenAllGenerations((generation) => {
    const index = generations.value.findIndex(({ id }) => id === generation.id);
    if (index === -1) {
      if (!loading.value && generation.status === 'PENDING') {
        refresh();
      }
      return;
    }
    const { task } = generations.value[index];
    generations.value[index] = { ...generation, task };

    if (selectedGeneration.value?.id === generation.id) {
      selectedGeneration.value = { ...generation, task };
    }
  });

  const headers = computed(
    (): VDataTableHeaders => [
      {
        title: t('$ezreeport.generations.task'),
        value: 'task.name',
      },
      {
        title: t('$ezreeport.namespace'),
        value: 'task.namespace.name',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.generations.origin'),
        value: 'origin',
      },
      {
        align: 'center',
        title: t('$ezreeport.generations.period'),
        value: '_period',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.generations.status'),
        value: 'status',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.generations.progress'),
        value: 'progress',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.generations.duration'),
        value: 'took',
      },
      {
        sortable: true,
        title: t('$ezreeport.generations.queued'),
        value: 'createdAt',
      },
      {
        title: t('$ezreeport.actions'),
        value: '_actions',
      },
    ]
  );

  async function restartGen(gen: Generation): Promise<void> {
    try {
      await restartGeneration(gen);
    } catch (error) {
      handleEzrError(t('$ezreeport.generations.errors.retry'), error);
    }
  }

  async function openInfo(gen: Generation): Promise<void> {
    try {
      const fullJob = await getGeneration(gen);
      selectedGeneration.value = fullJob;

      isInfoOpen.value = true;
    } catch (error) {
      handleEzrError(t('$ezreeport.generations.errors.info'), error);
    }
  }

  onUnmounted(() => {
    stopListening();
  });
</script>
