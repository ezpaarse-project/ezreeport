<template>
  <TaskDialogGeneration
    v-if="task"
    :value="props.value"
    :task="task"
    @input="emit('input', $event)"
    @generated="emit('generated', $event)"
  />
</template>

<script setup lang="ts">
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { ref, watch } from 'vue';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean,
  taskId: string,
}>();

const emit = defineEmits<{
  (e: 'input', value: boolean): void
  (e: 'generated', value: boolean): void
}>();

const { sdk } = useEzR();
const { $t } = useI18n();

const task = ref<tasks.FullTask>();
const loading = ref(false);
const error = ref('');

const fetch = async () => {
  loading.value = true;
  try {
    const { content } = await sdk.tasks.getTask(props.taskId);
    if (!content) {
      throw new Error($t('$ezreeport.errors.fetch').toString());
    }

    task.value = content;
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

watch(
  () => props.value,
  async (value) => {
    if (value) {
      await fetch();
    }
  },
  { immediate: true },
);
</script>
