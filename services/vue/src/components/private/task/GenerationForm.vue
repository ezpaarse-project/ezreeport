<template>
  <v-card
    :title="$t('$ezreeport.task.title:generate')"
    :subtitle="modelValue.name"
    :prepend-icon="mdiEmailFast"
  >
    <template v-if="loading" #loader>
      <v-progress-linear
        :indeterminate="loading && progress <= 0"
        :model-value="progress"
        color="primary"
        height="2"
      />
    </template>

    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row v-if="result || errorAlert">
        <v-col>
          <v-alert
            :title="
              errorAlert
                ? $t('$ezreeport.task.generation.error.title')
                : $t('$ezreeport.task.generation.success.title')
            "
            :text="$t('$ezreeport.task.generation.success.description')"
            :type="alertColor"
          >
            <template v-if="errorAlert" #text>
              <ul>
                <li>{{ errorAlert.message }}</li>

                <v-divider color="white" class="my-2" />

                <li>
                  {{
                    $t('$ezreeport.task.generation.error.type', {
                      value: errorAlert.type,
                    })
                  }}
                </li>
                <li>
                  {{
                    $t('$ezreeport.task.generation.error.name', {
                      value: errorAlert.name,
                    })
                  }}
                </li>
                <li v-if="errorAlert.cause?.layout != null">
                  {{
                    $t('$ezreeport.task.generation.error.layout', {
                      value: errorAlert.cause.layout + 1,
                    })
                  }}
                </li>
                <li v-if="errorAlert.cause?.figure != null">
                  {{
                    $t('$ezreeport.task.generation.error.figure', {
                      value: errorAlert.cause.figure + 1,
                    })
                  }}
                </li>
              </ul>
            </template>

            <template #append v-if="result">
              <v-menu>
                <template #activator="{ props: menu }">
                  <v-btn
                    v-bind="menu"
                    :icon="mdiDownload"
                    variant="elevated"
                    color="white"
                  />
                </template>

                <v-list>
                  <v-list-item
                    v-if="result.detail.files.report"
                    :title="$t('$ezreeport.task.generation.files.report')"
                    :prepend-icon="mdiFilePdfBox"
                    @click="downloadGenerationFile(result.detail.files.report)"
                  />

                  <v-divider
                    v-if="
                      result.detail.files.report && result.detail.files.detail
                    "
                  />

                  <v-list-item
                    v-if="result.detail.files.detail"
                    :title="$t('$ezreeport.task.generation.files.detail')"
                    :prepend-icon="mdiCodeJson"
                    @click="downloadGenerationFile(result.detail.files.detail)"
                  />
                </v-list>
              </v-menu>
            </template>
          </v-alert>
        </v-col>
      </v-row>

      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <MultiTextField
              :model-value="targets"
              :label="$t('$ezreeport.task.targets')"
              :add-label="$t('$ezreeport.task.targets:add')"
              :rules="[(val) => val.length >= 0 || $t('$ezreeport.required')]"
              :item-rules="[
                (val, i) =>
                  isEmail(val) || $t('$ezreeport.errors.invalidEmail', i + 1),
              ]"
              :item-placeholder="$t('$ezreeport.task.targets:hint')"
              :prepend-icon="mdiMailbox"
              variant="underlined"
              required
              @update:model-value="onTargetUpdated($event)"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-menu :close-on-content-click="false" location="start bottom">
              <template #activator="{ props: menu }">
                <v-text-field
                  :model-value="formattedPeriod"
                  :label="$t('$ezreeport.task.period')"
                  :loading="periodResolving && 'primary'"
                  :prepend-icon="mdiCalendarRange"
                  variant="underlined"
                  readonly
                  v-bind="menu"
                />
              </template>

              <v-card :loading="periodResolving && 'primary'">
                <template #text>
                  <v-date-picker
                    :model-value="periodRange"
                    :max="maxDate"
                    hide-header
                    show-adjacent-months
                    @update:model-value="updatePeriodFromRange($event)"
                  />
                </template>
              </v-card>
            </v-menu>
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('$ezreeport.task.generate')"
        :disabled="!isValid"
        :loading="loading"
        :append-icon="mdiSend"
        color="primary"
        @click="generate()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import type { Task } from '~sdk/tasks';
  import {
    mdiCalendarRange,
    mdiCodeJson,
    mdiDownload,
    mdiEmailFast,
    mdiFilePdfBox,
    mdiMailbox,
    mdiSend,
  } from '@mdi/js';
  import {
    add,
    eachDayOfInterval,
    endOfDay,
    isValid as isValidDate,
    max,
  } from 'date-fns';
  import { generateAndListenReportOfTask } from '~sdk/helpers/generations';
  import { getPeriodFromRecurrence } from '~sdk/recurrence';
  import {
    type ReportError,
    type ReportResult,
    getFileAsBlob,
  } from '~sdk/reports';

  import { downloadBlob } from '~/lib/files';

  import { isEmail } from '~/utils/validate';

  const maxDate = add(endOfDay(new Date()), { days: -1 });

  // Components props
  const props = defineProps<{
    /** The task to edit */
    modelValue: Omit<Task, 'template'>;
  }>();

  // Utils composables
  const { t } = useI18n();
  const { formatDate } = useDateLocale();

  /** Is basic form valid */
  const isValid = shallowRef(false);
  /** Custom targets */
  const targets = ref(props.modelValue.targets);
  /** Custom period */
  const period = ref({ end: new Date(), start: new Date() });
  /** Is the period resolving */
  const periodResolving = shallowRef(false);
  /** Is the report being generated */
  const loading = shallowRef(false);
  /** Progress of the generation */
  const progress = shallowRef(0);
  /** Error in the generation */
  const errorAlert = ref<ReportError | undefined>();
  /** Result of the generation */
  const result = ref<ReportResult | undefined>();

  /** Formatted period */
  const formattedPeriod = computed(
    () =>
      `${formatDate(period.value.start, 'P')} ~ ${formatDate(period.value.end, 'P')}`
  );
  /** Days in period */
  const periodRange = computed(() => eachDayOfInterval(period.value));
  /** Color of the alert */
  const alertColor = computed(() => {
    if (!errorAlert.value) {
      return 'success';
    }
    if (errorAlert.value.name === 'NoDataError') {
      return 'warning';
    }
    return 'error';
  });

  function onTargetUpdated(emails: string | string[] | undefined): void {
    if (emails == null) {
      targets.value = [];
      return;
    }

    let allTargets = emails;
    if (!Array.isArray(allTargets)) {
      allTargets = [allTargets];
    }

    // Allow multiple mail addresses, separated by semicolon or comma
    targets.value = [
      ...new Set(
        allTargets
          .join(';')
          .replaceAll(/[,]/g, ';')
          .split(';')
          .map((mail) => mail.trim())
      ),
    ];
  }

  async function updatePeriodFromRecurrence(
    date: Date,
    offset = 0
  ): Promise<void> {
    if (periodResolving.value) {
      return;
    }

    periodResolving.value = true;
    try {
      period.value = await getPeriodFromRecurrence(
        props.modelValue.recurrence,
        date,
        offset
      );
    } catch (error) {
      handleEzrError(t('$ezreeport.errors.resolvePeriod'), error);
    }
    periodResolving.value = false;
  }

  async function updatePeriodFromRange(range: Date | Date[]): Promise<void> {
    const date = Array.isArray(range) ? max(range) : range;
    if (!isValidDate(date)) {
      return;
    }

    await updatePeriodFromRecurrence(date);
  }

  async function generate(): Promise<void> {
    loading.value = true;
    progress.value = 0;
    errorAlert.value = undefined;
    result.value = undefined;

    try {
      const generation = generateAndListenReportOfTask(
        props.modelValue,
        period.value,
        targets.value
      );
      generation.on('progress', (ev) => {
        if (ev.progress != null) {
          progress.value = ev.progress;
        }
      });

      const res = await generation;
      if (!res.success && res.detail.error) {
        errorAlert.value = res.detail.error;
      }

      result.value = res;
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.generate'), error);
    }
    loading.value = false;
  }

  async function downloadGenerationFile(path: string): Promise<void> {
    if (!path || !props.modelValue || !result.value?.detail?.period) {
      return;
    }

    let filename = [
      'ezREEPORT',
      props.modelValue.name,
      formatDate(result.value.detail.period.start, 'yyyy-MM-dd'),
      formatDate(result.value.detail.period.end, 'yyyy-MM-dd'),
    ].join('_');

    const [, type, extension] =
      /\.(?<type>[a-z]+)\.(?<ext>[a-z]+)$/iv.exec(path) ?? [];

    if (type !== 'rep') {
      filename += `.${type}`;
    }
    filename += `.${extension}`;

    try {
      const blob = await getFileAsBlob(result.value.detail.taskId, path);
      downloadBlob(blob, filename);
    } catch (error) {
      handleEzrError(t('$ezreeport.errors.download', { path }), error);
    }
  }

  watch(
    () => props.modelValue,
    (val) => val && updatePeriodFromRecurrence(new Date(), -1),
    { immediate: true }
  );
</script>
