<template>
  <v-toolbar
    :title="title"
    color="transparent"
    density="comfortable"
  >
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
        icon="mdi-refresh"
        density="comfortable"
        class="ml-2"
        @click="refresh"
      />
    </template>
  </v-toolbar>

  <v-progress-linear :active="loading" color="primary" indeterminate />

  <v-expansion-panels>
    <v-expansion-panel v-if="generationQueue" :disabled="!availableActions.jobs">
      <template #title>
        {{ $t('$ezreeport.queues.generation.title') }}

        <v-spacer />

        <v-switch
          :model-value="generationQueue.status === 'active'"
          :label="generationQueue.status === 'active'
            ? $t('$ezreeport.task.enabled')
            : $t('$ezreeport.task.disabled')"
          :disabled="!availableActions.update"
          :loading="loading"
          density="comfortable"
          color="primary"
          hide-details
          style="transform: scale(0.8);"
          @update:model-value="toggleItemState(generationQueue)"
          @click.stop=""
        />
      </template>

      <template #text>
        <QueueGenerationJobTable
          :items-per-page="itemsPerPage"
          :items-per-page-options="itemsPerPageOptions"
          @update:items-per-page="$emit('update:itemsPerPage', $event)"
        />
      </template>
    </v-expansion-panel>

    <v-expansion-panel v-if="mailQueue" :disabled="!availableActions.jobs">
      <template #title>
        {{ $t('$ezreeport.queues.mail.title') }}

        <v-spacer />

        <v-switch
          :model-value="mailQueue.status === 'active'"
          :label="mailQueue.status === 'active'
            ? $t('$ezreeport.task.enabled')
            : $t('$ezreeport.task.disabled')"
          :disabled="!availableActions.update"
          :loading="loading"
          density="comfortable"
          color="primary"
          hide-details
          style="transform: scale(0.8);"
          @update:model-value="toggleItemState(mailQueue)"
          @click.stop=""
        />
      </template>

      <template #text>
        <QueueMailJobTable
          :items-per-page="itemsPerPage"
          :items-per-page-options="itemsPerPageOptions"
          @update:items-per-page="$emit('update:itemsPerPage', $event)"
        />
      </template>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import {
  getAllQueues,
  getQueueJobs,
  updateQueue,
  type Queue,
} from '~sdk/queues';

// Components props
const props = defineProps<{
  titlePrefix?: string;
  itemsPerPageOptions?: number[] | { title: string; value: number }[];
  itemsPerPage?: number;
}>();

// Components events
defineEmits<{
  (e: 'update:itemsPerPage', value: number): void
}>();

// Utils composable
const { t } = useI18n();

/** Is loading */
const loading = ref(false);
/** Available queues */
const queues = ref<Queue[]>([]);
/** Are permissions ready */
const arePermissionsReady = ref(false);

const title = computed(() => `${props.titlePrefix || ''}${t('$ezreeport.queues._.title:list')}`);

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    update: hasPermission(updateQueue),

    jobs: hasPermission(getQueueJobs),
  };
});

const generationQueue = computed(() => queues.value.find((q) => q.name === 'generation'));
const mailQueue = computed(() => queues.value.find((q) => q.name === 'mail'));

async function refresh() {
  loading.value = true;
  try {
    queues.value = await getAllQueues();
  } catch (e) {
    handleEzrError(t('$ezreeport.queues.errors.refresh'), e);
  }
  loading.value = false;
}

async function toggleItemState(queue: Queue) {
  loading.value = true;
  try {
    await updateQueue({ name: queue.name, status: queue.status === 'active' ? 'paused' : 'active' });
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.queues.errors.edit'), e);
    loading.value = false;
  }
}

refresh();

refreshPermissions()
  .then(() => { arePermissionsReady.value = true; });
</script>
