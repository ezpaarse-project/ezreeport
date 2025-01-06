<template>
  <v-card
    :title="dataJob?.data.task.name ?? $t('$ezreeport.queues.mail.error')"
    :subtitle="dataJob?.data.namespace.name"
    prepend-icon="mdi-play-speed"
  >
    <template #append>
      <span class="text-overline">
        {{ $t('$ezreeport.queues.mail.title') }}
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

      <template v-if="dataJob">
        <v-divider />

        <v-row>
          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader :title="$t('$ezreeport.queues.mail.header:generation')" />

              <v-list-item
                :title="$t('$ezreeport.queues.mail.generationJob')"
                prepend-icon="mdi-play-speed"
                append-icon="mdi-open-in-new"
                @click="isInfoOpen = true"
              />
            </v-list>
          </v-col>

          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader />

              <v-list-item
                :title="$t('$ezreeport.queues.mail.attachement')"
                append-icon="mdi-download"
                prepend-icon="mdi-paperclip"
                @click="downloadAttachement()"
              />
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
                      v-for="target in dataJob.data.task.targets"
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
      </template>
    </template>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </v-card>

  <v-dialog
    v-if="generationJob"
    v-model="isInfoOpen"
    width="70%"
    scrollable
  >
    <template #default>
      <QueueGenerationJobCard :model-value="generationJob">
        <template #actions>
          <v-btn :text="$t('$ezreeport.close')" @click="isInfoOpen = false" />
        </template>
      </QueueGenerationJobCard>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  getGenerationJob,
  isErrorMailJob,
  isDataMailJob,
  type GenerationJobWithResult,
  type MailJob,
} from '~sdk/helpers/jobs';

import { b64toBlob, downloadBlob } from '~/lib/files';

// Components props
const props = defineProps<{
  /** The job to show */
  modelValue: MailJob,
}>();

// Utils composables
const { t } = useI18n();

/** Is info opened */
const isInfoOpen = ref(false);
/** Linked generation job */
const generationJob = ref<GenerationJobWithResult | undefined>();

const dataJob = computed(() => (isDataMailJob(props.modelValue) ? props.modelValue : undefined));
const errorJob = computed(() => (isErrorMailJob(props.modelValue) ? props.modelValue : undefined));

async function refreshGenerationJob() {
  if (!dataJob.value) {
    return;
  }

  try {
    generationJob.value = await getGenerationJob(dataJob.value.data.generationId);
  } catch (e) {
    handleEzrError(t('$ezreeport.queues._.errors.open'), e);
  }
}

async function downloadAttachement() {
  const data = dataJob.value?.data ?? errorJob.value?.data.error ?? {};
  if (!('file' in data) || typeof data.file !== 'string') {
    return;
  }

  const ext = dataJob.value?.data.success ? 'pdf' : 'json';
  let filename = dataJob.value?.data.url.split('/').pop() ?? `report.${ext}`;
  let mime = `application/${ext}`;

  if (errorJob.value) {
    filename = errorJob.value.data.error.filename;
    mime = 'text/plain';
  }

  try {
    const blob = b64toBlob(data.file, mime);
    downloadBlob(blob, filename);
  } catch (e) {
    handleEzrError(t('$ezreeport.errors.downloadAttachement'), e);
  }
}

refreshGenerationJob();
</script>
