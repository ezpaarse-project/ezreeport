<template>
  <v-card
    :title="modelValue.data.task.name"
    :subtitle="namespaceName"
    :loading="loading"
    prepend-icon="mdi-play-speed"
  >
    <template #append>
      <span class="text-overline">
        {{ $t('$ezreeport.queues.generation.title') }}
      </span>
    </template>

    <template #text>
      <v-row>
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader :title="$t('$ezreeport.queues._.info')" />

            <v-list-item :title="modelValue.id" :subtitle="$t('$ezreeport.queues._.id')" prepend-icon="mdi-identifier" />

            <v-list-item :title="$t(`$ezreeport.queues._.statusList.${modelValue.status}`)" :subtitle="$t('$ezreeport.queues._.status')">
              <template #prepend>
                <QueueJobStatusIcon :model-value="modelValue.status" />
              </template>
            </v-list-item>

            <v-list-item :title="modelValue.attempts" :subtitle="$t('$ezreeport.queues._.tries')" prepend-icon="mdi-restart" />
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item v-if="modelValue.added" :subtitle="$t('$ezreeport.queues._.added')" prepend-icon="mdi-calendar-import">
              <template #title>
                <LocalDate :model-value="modelValue.added" format="PPPpp" />
              </template>
            </v-list-item>

            <v-list-item v-if="modelValue.started" :subtitle="$t('$ezreeport.queues._.started')" prepend-icon="mdi-timer-play">
              <template #title>
                <LocalDate :model-value="modelValue.started" format="PPPpp" />
              </template>
            </v-list-item>

            <v-list-item v-if="modelValue.ended" :subtitle="$t('$ezreeport.queues._.ended')" prepend-icon="mdi-timer-stop">
              <template #title>
                <LocalDate :model-value="modelValue.ended" format="PPPpp" />
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="2" class="d-flex justify-center">
          <v-progress-circular
            :model-value="modelValue.progress * 100"
            color="primary"
            size="128"
            width="8"
          >
            {{ modelValue.progress * 100 }}%
          </v-progress-circular>
        </v-col>
      </v-row>

      <v-divider />

      <v-row>
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader :title="$t('$ezreeport.queues.generation.header:request')" />

            <v-list-item :title="modelValue.data.origin" :subtitle="$t('$ezreeport.queues.generation.origin')" prepend-icon="mdi-account" />
          </v-list>
        </v-col>

        <v-col v-if="modelValue.data.period">
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item :subtitle="$t('$ezreeport.task.period')" prepend-icon="mdi-calendar-range">
              <template #title>
                <LocalDate :model-value="modelValue.data.period.start" format="dd/MM/yyyy" />
                ~
                <LocalDate :model-value="modelValue.data.period.end" format="dd/MM/yyyy" />
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item :title="modelValue.data.shouldWriteActivity ? $t('$ezreeport.no') : $t('$ezreeport.yes')" :subtitle="$t('$ezreeport.queues.generation.debug')" prepend-icon="mdi-bug-outline" />
          </v-list>
        </v-col>
      </v-row>

      <v-divider />

      <v-row>
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader :title="$t('$ezreeport.queues.generation.header:task')" />

            <v-list-item :title="modelValue.data.task.id" :subtitle="$t('$ezreeport.task.id')" prepend-icon="mdi-identifier" />

            <v-list-item :title="$t(`$ezreeport.task.recurrenceList.${modelValue.data.task.recurrence}`)" :subtitle="$t('$ezreeport.task.recurrence')" prepend-icon="mdi-calendar-refresh" />

            <v-list-item :title="modelValue.data.task.template.index" :subtitle="$t('$ezreeport.template.index')" prepend-icon="mdi-database" />
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item :title="modelValue.data.task.extendedId" :subtitle="$t('$ezreeport.template.id')" prepend-icon="mdi-identifier" />

            <template v-if="template">
              <v-list-item :title="template.name" :subtitle="$t('$ezreeport.queues.generation.template')" prepend-icon="mdi-view-grid" />

              <v-list-item :title="modelValue.data.task.template.dateField" :subtitle="$t('$ezreeport.template.dateField')" prepend-icon="mdi-calendar-search" />
            </template>
          </v-list>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col>
          <v-list>
            <v-list-subheader :title="$t('$ezreeport.task.targets')" />

            <v-list-item prepend-icon="mdi-email">
              <template #title>
                <v-chip-group>
                  <v-chip
                    v-for="target in modelValue.data.task.targets"
                    :key="target"
                    :text="target"
                    density="comfortable"
                    class="mr-2"
                  />
                </v-chip-group>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <template v-if="modelValue.result">
        <v-divider />

        <v-row>
          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader :title="$t('$ezreeport.queues.generation.header:result')" />

              <v-list-item :title="$t(`$ezreeport.queues._.statusList.${modelValue.result.success ? 'completed' : 'failed'}`)" :subtitle="$t('$ezreeport.queues.generation.status')">
                <template #prepend>
                  <QueueJobStatusIcon :model-value="modelValue.result.success ? 'completed' : 'failed'" />
                </template>
              </v-list-item>

              <v-list-item v-if="modelValue.result.detail.period" :subtitle="$t('$ezreeport.task.period')" prepend-icon="mdi-calendar-range">
                <template #title>
                  <LocalDate :model-value="modelValue.result.detail.period.start" format="dd/MM/yyyy" />
                  ~
                  <LocalDate :model-value="modelValue.result.detail.period.end" format="dd/MM/yyyy" />
                </template>
              </v-list-item>

              <v-list-item
                v-if="modelValue.result.detail.auth?.elastic?.username"
                :title="modelValue.result.detail.auth.elastic.username"
                :subtitle="$t('$ezreeport.queues.generation.auth')"
                prepend-icon="mdi-account-key"
              />
            </v-list>
          </v-col>

          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader :title="$t('$ezreeport.queues.generation.header:files')" />

              <v-list-item
                :title="$t('$ezreeport.task.generation.files.report')"
                :disabled="!files.report"
                append-icon="mdi-download"
                prepend-icon="mdi-file-pdf-box"
                @click="downloadGenerationFile(files.report)"
              />

              <v-list-item
                :title="$t('$ezreeport.task.generation.files.detail')"
                :disabled="!files.detail"
                append-icon="mdi-download"
                prepend-icon="mdi-code-json"
                @click="downloadGenerationFile(files.detail)"
              />

              <v-list-item
                v-if="files.debug"
                :title="$t('$ezreeport.task.generation.files.debug')"
                append-icon="mdi-download"
                prepend-icon="mdi-bug-outline"
                @click="downloadGenerationFile(files.debug)"
              />
            </v-list>
          </v-col>
        </v-row>

        <v-row v-if="modelValue.result.detail.sendingTo" no-gutters>
          <v-col>
            <v-list>
              <v-list-subheader :title="$t('$ezreeport.task.targets')" />

              <v-list-item prepend-icon="mdi-email">
                <template #title>
                  <v-chip-group>
                    <v-chip
                      v-for="target in modelValue.result.detail.sendingTo"
                      :key="target"
                      :text="target"
                      density="comfortable"
                      class="mr-2"
                    />
                  </v-chip-group>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <v-row v-if="modelValue.result.detail.error">
          <v-col>
            <v-alert type="error">
              <template #text>
                <ul>
                  <li>{{ modelValue.result.detail.error.message }}</li>
                  <template v-if="modelValue.result.detail.error.cause">
                    <li v-if="modelValue.result.detail.error.cause.type">
                      {{ $t('$ezreeport.task.generation.error.type') }}: "{{ modelValue.result.detail.error.cause.type }}"
                    </li>
                    <li v-if="modelValue.result.detail.error.cause.layout">
                      {{ $t('$ezreeport.task.generation.error.layout') }}: "{{ modelValue.result.detail.error.cause.layout }}"
                    </li>
                    <li v-if="modelValue.result.detail.error.cause.figure">
                      {{ $t('$ezreeport.task.generation.error.figure') }}: "{{ modelValue.result.detail.error.cause.figure }}"
                    </li>
                  </template>
                </ul>
              </template>
            </v-alert>
          </v-col>
        </v-row>
      </template>
    </template>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { getCurrentNamespaces } from '~sdk/auth';
import { getAllTemplates, type Template } from '~sdk/templates';
import type { GenerationJobWithResult } from '~sdk/helpers/jobs';
import { getFileAsBlob } from '~sdk/reports';

import { downloadBlob } from '~/lib/files';

// Components props
const props = defineProps<{
  /** The job to show */
  modelValue: GenerationJobWithResult,
}>();

/** Is loading */
const loading = ref(false);
/** Map between namespaceId and namespace's name */
const namespaceMap = ref(new Map<string, string>());
/** Map between templateId and template */
const templateMap = ref(new Map<string, Omit<Template, 'body'>>());

/** Namespace of the current job */
const namespaceName = computed(
  () => namespaceMap.value.get(props.modelValue.data.task.namespaceId),
);
/** Template of the current job */
const template = computed(
  () => templateMap.value.get(props.modelValue.data.task.extendedId),
);

const files = computed<Record<string, string>>(() => props.modelValue.result?.detail.files ?? {});

async function downloadGenerationFile(path: string) {
  if (!props.modelValue.result) {
    return;
  }

  try {
    const filename = path.split('/').pop() ?? 'download';
    const blob = await getFileAsBlob(props.modelValue.result.detail.taskId, path);
    downloadBlob(blob, filename);
  } catch (e) {
    console.error(e);
  }
}

async function refreshNamespaces() {
  try {
    const namespaces = await getCurrentNamespaces();
    namespaceMap.value = new Map(namespaces.map((n) => [n.id, n.name]));
  } catch (e) {
    console.error(e);
  }
}

async function refreshTemplates() {
  try {
    const templates = await getAllTemplates({ pagination: { count: 0 } });
    templateMap.value = new Map(templates.items.map((t) => [t.id, t]));
  } catch (e) {
    console.error(e);
  }
}

async function refresh() {
  loading.value = true;
  await Promise.allSettled([
    refreshNamespaces(),
    refreshTemplates(),
  ]);
  loading.value = false;
}

refresh();
</script>
