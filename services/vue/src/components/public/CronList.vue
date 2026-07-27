<template>
  <v-toolbar :title="title" color="transparent" density="comfortable">
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template v-if="$slots.title" #title>
      <slot name="title" :title="title" />
    </template>

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

  <v-progress-linear :active="loading" color="primary" indeterminate />

  <v-list lines="two">
    <v-list-item
      v-for="cron in crons"
      :key="cron.name"
      :title="
        $te(`$ezreeport.crons.${cron.name}`)
          ? $t(`$ezreeport.crons.${cron.name}`)
          : cron.name
      "
    >
      <template #append>
        <v-switch
          :model-value="cron.running"
          :label="
            cron.running
              ? $t('$ezreeport.task.enabled')
              : $t('$ezreeport.task.disabled')
          "
          :disabled="!availableActions.update"
          :loading="loading"
          density="comfortable"
          color="primary"
          hide-details
          style="transform: scale(0.8)"
          @update:model-value="toggleItemState(cron)"
        />
      </template>

      <template #subtitle>
        <v-chip
          v-if="cron.lastRun"
          :prepend-icon="mdiCalendarStart"
          density="compact"
          variant="outlined"
          class="mr-2"
        >
          <LocalDate :model-value="cron.lastRun" format="PPPpp" />
        </v-chip>

        <v-chip
          v-if="cron.nextRun"
          :prepend-icon="mdiCalendarEnd"
          density="compact"
          variant="outlined"
          class="mr-2"
        >
          <LocalDate :model-value="cron.nextRun" format="PPPp" />
        </v-chip>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
  import { mdiCalendarEnd, mdiCalendarStart, mdiRefresh } from '@mdi/js';
  import { type Cron, getAllCrons, updateCron } from '~sdk/crons';

  // Components props
  const props = defineProps<{
    titlePrefix?: string;
  }>();

  // Utils composable
  const { t } = useI18n();

  /** Is loading */
  const loading = shallowRef(false);
  /** Available crons */
  const crons = ref<Cron[]>([]);

  const { availableActions } = usePermissions({ update: [updateCron] });

  const title = computed(
    () => `${props.titlePrefix || ''}${t('$ezreeport.crons.title:list')}`
  );

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      crons.value = await getAllCrons();
    } catch (error) {
      handleEzrError(t('$ezreeport.crons.errors.refresh'), error);
    }
    loading.value = false;
  }

  async function toggleItemState(cron: Cron): Promise<void> {
    loading.value = true;
    try {
      await updateCron({ name: cron.name, running: !cron.running });
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.crons.errors.edit'), error);
      loading.value = false;
    }
  }

  void refresh();
</script>
