<template>
  <div class="d-flex flex-wrap" style="gap: 0.25rem">
    <v-chip
      v-if="user"
      v-tooltip:top="$t('$ezreeport.task-activity.origin')"
      :text="user"
      prepend-icon="mdi-account"
      density="comfortable"
      size="small"
    />

    <TaskTargetsChip
      v-if="targets"
      :model-value="targets"
      density="comfortable"
      size="small"
      show-label
    />
    <v-chip
      v-if="files?.detail"
      :text="$t('$ezreeport.task.generation.files.detail')"
      prepend-icon="mdi-code-json"
      append-icon="mdi-download"
      density="comfortable"
      size="small"
      @click="downloadGenerationFile(files.detail)"
    />

    <v-chip
      v-if="files?.report"
      :text="$t('$ezreeport.task.generation.files.report')"
      prepend-icon="mdi-file-pdf-box"
      append-icon="mdi-download"
      density="comfortable"
      size="small"
      @click="downloadGenerationFile(files.report)"
    />
  </div>
</template>

<script setup lang="ts">
import { isBefore, isValid } from 'date-fns';

import { downloadBlob } from '~/lib/files';
import { getFileAsBlob } from '~sdk/reports';

import type { TaskActivity } from '~sdk/task-activity';

// Components props
const props = defineProps<{
  /** The tag to show */
  modelValue: TaskActivity,
}>();

// Utils composables
const { t } = useI18n();

const isObject = (value: unknown): value is object => !!value && typeof value === 'object' && !Array.isArray(value);

const data = computed(() => {
  if (isObject(props.modelValue.data)) {
    return props.modelValue.data;
  }
  return {};
});

const user = computed(() => {
  if ('user' in data.value && typeof data.value.user === 'string') {
    return data.value.user;
  }
  return undefined;
});

const targets = computed(() => {
  if ('targets' in data.value && Array.isArray(data.value.targets) && data.value.targets.every((v) => typeof v === 'string')) {
    return data.value.targets;
  }
  return undefined;
});

const files = computed(() => {
  const now = new Date();

  if ('destroyAt' in data.value && typeof data.value.destroyAt === 'string') {
    const date = new Date(data.value.destroyAt);
    if (isValid(date) && isBefore(date, now)) {
      return undefined;
    }
  }

  if ('files' in data.value && isObject(data.value.files)) {
    return {
      report: 'report' in data.value.files && typeof data.value.files.report === 'string' ? data.value.files.report : undefined,
      detail: 'detail' in data.value.files && typeof data.value.files.detail === 'string' ? data.value.files.detail : undefined,
    };
  }

  return undefined;
});

async function downloadGenerationFile(path: string) {
  try {
    const filename = path.split('/').pop() ?? 'download';
    const blob = await getFileAsBlob(props.modelValue.taskId, path);
    downloadBlob(blob, filename);
  } catch (e) {
    handleEzrError(t('$ezreeport.errors.download', { path }), e);
  }
}
</script>
