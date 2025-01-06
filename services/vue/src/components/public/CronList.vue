<template>
  <v-toolbar
    :title="`${titlePrefix || ''}${$t('$ezreeport.crons.title:list')}`"
    color="transparent"
    density="comfortable"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

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

  <v-progress-linear :active="loading" color="primary" indeterminate />

  <v-list lines="two">
    <v-list-item
      v-for="cron in crons"
      :key="cron.name"
      :title="cron.name"
    >
      <template #append>
        <v-switch
          :model-value="cron.running"
          :label="cron.running
            ? $t('$ezreeport.task.enabled')
            : $t('$ezreeport.task.disabled')"
          :disabled="!availableActions.update"
          :loading="loading"
          density="comfortable"
          color="primary"
          hide-details
          style="transform: scale(0.8);"
          @update:model-value="toggleItemState(cron)"
        />
      </template>

      <template #subtitle>
        <v-chip
          v-if="cron.lastRun"
          prepend-icon="mdi-calendar-start"
          density="compact"
          variant="outlined"
          class="mr-2"
        >
          <LocalDate :model-value="cron.lastRun" format="PPPpp" />
        </v-chip>

        <v-chip
          v-if="cron.nextRun"
          prepend-icon="mdi-calendar-end"
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
import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import { getAllCrons, updateCron, type Cron } from '~sdk/crons';

// Components props
defineProps<{
  titlePrefix?: string;
}>();

/** Is loading */
const loading = ref(false);
/** Available crons */
const crons = ref<Cron[]>([]);
/** Are permissions ready */
const arePermissionsReady = ref(false);

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    update: hasPermission(updateCron),
  };
});

async function refresh() {
  loading.value = true;
  try {
    crons.value = await getAllCrons();
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

async function toggleItemState(cron: Cron) {
  loading.value = true;
  try {
    await updateCron({ name: cron.name, running: !cron.running });
    refresh();
  } catch (e) {
    console.error(e);
    loading.value = false;
  }
}

refresh();

refreshPermissions()
  .then(() => { arePermissionsReady.value = true; });
</script>
