<template>
  <v-card
    :title="task?.name ?? modelValue.taskId"
    :subtitle="task?.namespace?.name"
    prepend-icon="mdi-play-speed"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader :title="$t('$ezreeport.generations.info')" />

            <v-list-item
              :title="modelValue.id"
              :subtitle="$t('$ezreeport.generations.id')"
              prepend-icon="mdi-identifier"
            />

            <v-list-item
              :title="
                $t(`$ezreeport.generations.statusList.${modelValue.status}`)
              "
              :subtitle="$t('$ezreeport.generations.status')"
            >
              <template #prepend>
                <GenerationStatusIcon :model-value="modelValue" />
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item
              :subtitle="$t('$ezreeport.generations.queued')"
              prepend-icon="mdi-clock-plus-outline"
            >
              <template #title>
                <LocalDate :model-value="modelValue.createdAt" format="PPPpp" />
              </template>
            </v-list-item>

            <template v-if="modelValue.startedAt">
              <v-list-item
                :subtitle="$t('$ezreeport.generations.started')"
                prepend-icon="mdi-timer-play"
              >
                <template #title>
                  <LocalDate
                    :model-value="modelValue.startedAt"
                    format="PPPpp"
                  />
                </template>
              </v-list-item>

              <v-list-item
                v-if="isEnded"
                :subtitle="$t('$ezreeport.generations.ended')"
                prepend-icon="mdi-timer-stop"
              >
                <template #title>
                  <LocalDate
                    :model-value="
                      new Date(
                        modelValue.startedAt.getTime() + (modelValue.took ?? 0)
                      )
                    "
                    format="PPPpp"
                  />
                </template>
              </v-list-item>
            </template>

            <v-list-item
              v-if="modelValue.updatedAt"
              :subtitle="$t('$ezreeport.generations.lastUpdate')"
              prepend-icon="mdi-clock-edit-outline"
            >
              <template #title>
                <LocalDate :model-value="modelValue.updatedAt" format="PPPpp" />
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="2" class="d-flex justify-center">
          <v-progress-circular
            v-if="modelValue.progress != null"
            :model-value="modelValue.progress"
            color="primary"
            size="128"
            width="8"
          >
            {{ modelValue.progress }}%
          </v-progress-circular>
        </v-col>
      </v-row>

      <v-divider />

      <v-row>
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader
              :title="$t('$ezreeport.generations.header:request')"
            />

            <v-list-item
              :title="modelValue.origin"
              :subtitle="$t('$ezreeport.generations.origin')"
              prepend-icon="mdi-account"
            />
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item
              :subtitle="$t('$ezreeport.task.period')"
              prepend-icon="mdi-calendar-range"
            >
              <template #title>
                <LocalDate :model-value="modelValue.start" format="P" />
                ~
                <LocalDate :model-value="modelValue.end" format="P" />
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item
              :title="
                modelValue.writeActivity
                  ? $t('$ezreeport.no')
                  : $t('$ezreeport.yes')
              "
              :subtitle="$t('$ezreeport.generations.debug')"
              prepend-icon="mdi-bug-outline"
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
                    v-for="target in modelValue.targets"
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

      <v-divider />

      <template v-if="taskLoading">
        <v-list-subheader
          :title="$t('$ezreeport.generations.header:fetch:task')"
        />
        <v-progress-linear color="primary" indeterminate />
      </template>

      <v-row v-if="task">
        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader
              :title="$t('$ezreeport.generations.header:task')"
            />

            <v-list-item
              :title="task.id"
              :subtitle="$t('$ezreeport.task.id')"
              prepend-icon="mdi-identifier"
            />

            <v-list-item
              :title="$t(`$ezreeport.task.recurrenceList.${task.recurrence}`)"
              :subtitle="$t('$ezreeport.task.recurrence')"
              prepend-icon="mdi-calendar-refresh"
            />

            <v-list-item
              :title="task.template.index"
              :subtitle="$t('$ezreeport.template.index')"
              prepend-icon="mdi-database"
            />
          </v-list>
        </v-col>

        <v-col>
          <v-list lines="two" density="compact">
            <v-list-subheader />

            <v-list-item
              :title="task.extendedId"
              :subtitle="$t('$ezreeport.template.id')"
              prepend-icon="mdi-identifier"
            />

            <template v-if="templateLoading">
              <v-list-subheader
                :title="$t('$ezreeport.generations.header:fetch:template')"
              />
              <v-progress-linear color="primary" indeterminate />
            </template>

            <template v-if="template">
              <v-list-item
                :title="template.name"
                :subtitle="$t('$ezreeport.generations.template')"
                prepend-icon="mdi-view-grid"
              />

              <v-list-item
                :title="task.template.dateField"
                :subtitle="$t('$ezreeport.template.dateField')"
                prepend-icon="mdi-calendar-search"
              />
            </template>
          </v-list>
        </v-col>
      </v-row>

      <template v-if="resultLoading">
        <v-list-subheader
          :title="$t('$ezreeport.generations.header:fetch:result')"
        />
        <v-progress-linear color="primary" indeterminate />
      </template>

      <template v-if="result">
        <v-divider />

        <v-row>
          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader
                :title="$t('$ezreeport.generations.header:result')"
              />

              <v-list-item
                v-if="result.detail.period"
                :subtitle="$t('$ezreeport.task.period')"
                prepend-icon="mdi-calendar-range"
              >
                <template #title>
                  <LocalDate
                    :model-value="result.detail.period.start"
                    format="P"
                  />
                  ~
                  <LocalDate
                    :model-value="result.detail.period.end"
                    format="P"
                  />
                </template>
              </v-list-item>

              <v-list-item
                v-if="result.detail.auth?.elastic?.username"
                :title="result.detail.auth.elastic.username"
                :subtitle="$t('$ezreeport.generations.auth')"
                prepend-icon="mdi-account-key"
              />
            </v-list>
          </v-col>

          <v-col>
            <v-list lines="two" density="compact">
              <v-list-subheader
                :title="$t('$ezreeport.generations.header:files')"
              />

              <v-list-item
                :title="$t('$ezreeport.task.generation.files.report')"
                :disabled="!result.detail.files.report"
                append-icon="mdi-download"
                prepend-icon="mdi-file-pdf-box"
                @click="
                  downloadGenerationFile(result.detail.files.report || '')
                "
              />

              <v-list-item
                :title="$t('$ezreeport.task.generation.files.detail')"
                :disabled="!result.detail.files.detail"
                append-icon="mdi-download"
                prepend-icon="mdi-code-json"
                @click="
                  downloadGenerationFile(result.detail.files.detail || '')
                "
              />

              <v-list-item
                v-if="'debug' in result.detail.files"
                :title="$t('$ezreeport.task.generation.files.debug')"
                append-icon="mdi-download"
                prepend-icon="mdi-bug-outline"
                @click="
                  downloadGenerationFile(`${result.detail.files.debug}` || '')
                "
              />
            </v-list>
          </v-col>
        </v-row>

        <v-row v-if="result.detail.sendingTo" no-gutters>
          <v-col>
            <v-list>
              <v-list-subheader :title="$t('$ezreeport.task.targets')" />

              <v-list-item prepend-icon="mdi-email">
                <template #title>
                  <v-chip-group>
                    <v-chip
                      v-for="target in result.detail.sendingTo"
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

        <v-row v-if="result.detail.error">
          <v-col>
            <v-list-subheader
              :title="$t('$ezreeport.generations.header:error')"
              class="ml-4"
            />

            <v-alert type="error" variant="outlined">
              <template #text>
                <ul>
                  <li>{{ result.detail.error.message }}</li>
                  <li>
                    {{ $t('$ezreeport.task.generation.error.type') }}: "{{
                      result.detail.error.type
                    }}"
                  </li>
                  <li>
                    {{ $t('$ezreeport.task.generation.error.name') }}: "{{
                      result.detail.error.name
                    }}"
                  </li>
                  <li v-if="result.detail.error.cause?.layout">
                    {{ $t('$ezreeport.task.generation.error.layout') }}: "{{
                      result.detail.error.cause.layout
                    }}"
                  </li>
                  <li v-if="result.detail.error.cause?.figure">
                    {{ $t('$ezreeport.task.generation.error.figure') }}: "{{
                      result.detail.error.cause.figure
                    }}"
                  </li>
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
import { getTask } from '~sdk/tasks';
import { getTemplate } from '~sdk/templates';
import { getFileAsBlob, getFileAsJson } from '~sdk/reports';
import type { Generation } from '~sdk/generations';
import { isGenerationEnded } from '~sdk/helpers/generations';

import { downloadBlob } from '~/lib/files';

const props = defineProps<{
  modelValue: Generation;
}>();

// oxlint-disable-next-line id-length
const { t } = useI18n();

const taskLoading = ref(false);
const templateLoading = ref(false);
const resultLoading = ref(false);

/** Has generation ended */
const isEnded = computed(() => isGenerationEnded(props.modelValue));
/** Task's id, used for cache purposes */
const taskId = computed(() => props.modelValue.taskId);
/** Task of the current generation */
const task = computedAsync(async () => {
  taskLoading.value = true;
  try {
    const value = await getTask(taskId.value, ['namespace']);
    taskLoading.value = false;
    return value;
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.open'), err);
    taskLoading.value = false;
    return;
  }
});

/** Extended template of the current generation, used for cache purposes */
const extendedId = computed(() => task.value?.extendedId);
/** Template of the current generation */
const template = computedAsync(async () => {
  if (!extendedId.value) {
    return;
  }

  templateLoading.value = true;
  try {
    const value = await getTemplate(extendedId.value);
    templateLoading.value = false;
    return value;
  } catch (err) {
    handleEzrError(t('$ezreeport.template.errors.open'), err);
    templateLoading.value = false;
    return;
  }
});

/** Report id of the current generation, used for cache purposes */
const reportId = computed(() =>
  isEnded.value ? props.modelValue.reportId : undefined
);
/** Result of the current generation */
const result = computedAsync(async () => {
  if (!reportId.value) {
    return;
  }

  resultLoading.value = true;
  try {
    const value = await getFileAsJson(
      taskId.value,
      `${reportId.value}.det.json`
    );
    resultLoading.value = false;
    return value;
  } catch (err) {
    resultLoading.value = false;
    return;
  }
});

async function downloadGenerationFile(path: string) {
  try {
    const filename = path.split('/').pop() ?? 'download';
    const blob = await getFileAsBlob(props.modelValue.taskId, path);
    downloadBlob(blob, filename);
  } catch (err) {
    handleEzrError(t('$ezreeport.errors.download', { path }), err);
  }
}
</script>
