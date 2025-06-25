<template>
  <v-card
    :title="$t('$ezreeport.task.title:generate')"
    :subtitle="modelValue.name"
    prepend-icon="mdi-email-fast"
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
      <v-row v-if="result || error">
        <v-col>
          <v-alert
            :title="error ? $t('$ezreeport.task.generation.error.title') : $t('$ezreeport.task.generation.success.title')"
            :text="$t('$ezreeport.task.generation.success.description')"
            :type="error ? 'error' : 'success'"
          >
            <template v-if="error" #text>
              <ul>
                <li>{{ error.message }}</li>
                <template v-if="error.cause">
                  <li v-if="error.cause.type">
                    {{ $t('$ezreeport.task.generation.error.type') }}: "{{ error.cause.type }}"
                  </li>
                  <li v-if="error.cause.layout">
                    {{ $t('$ezreeport.task.generation.error.layout') }}: "{{ error.cause.layout }}"
                  </li>
                  <li v-if="error.cause.figure">
                    {{ $t('$ezreeport.task.generation.error.figure') }}: "{{ error.cause.figure }}"
                  </li>
                </template>
              </ul>
            </template>

            <template #append v-if="result">
              <v-menu>
                <template #activator="{ props: menu }">
                  <v-btn
                    v-bind="menu"
                    variant="elevated"
                    icon="mdi-download"
                  />
                </template>

                <v-list>
                  <v-list-item
                    v-if="result.detail.files.report"
                    :title="$t('$ezreeport.task.generation.files.report')"
                    prepend-icon="mdi-file-pdf-box"
                    @click="downloadGenerationFile(result.detail.files.report)"
                  />

                  <v-divider v-if="result.detail.files.report && result.detail.files.detail" />

                  <v-list-item
                    v-if="result.detail.files.detail"
                    :title="$t('$ezreeport.task.generation.files.detail')"
                    prepend-icon="mdi-code-json"
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
              :rules="[(v) => v.length >= 0 || $t('$ezreeport.required')]"
              :item-rules="[(v, i) => isEmail(v) || $t('$ezreeport.errors.invalidEmail', i + 1)]"
              :item-placeholder="$t('$ezreeport.task.targets:hint')"
              prepend-icon="mdi-mailbox"
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
                  prepend-icon="mdi-calendar-range"
                  variant="underlined"
                  readonly
                  v-bind="menu"
                />
              </template>

              <v-card>
                <template #text>
                  <v-date-picker
                    :model-value="periodRange"
                    :max="maxDate"
                    hide-header
                    show-adjacent-months
                    @update:model-value="updatePeriod($event)"
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
        append-icon="mdi-send"
        color="primary"
        @click="generate()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import {
  eachDayOfInterval,
  format,
  add,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  getYear,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  max,
  isValid as isValidDate,
} from 'date-fns';

import {
  getFileAsBlob,
  type ReportResult,
  type ReportErrorCause,
} from '~sdk/reports';
import { generateAndListenReportOfTask } from '~sdk/helpers/jobs';
import type { Task } from '~sdk/tasks';

import { downloadBlob } from '~/lib/files';
import { isEmail } from '~/utils/validate';

const maxDate = add(endOfDay(new Date()), { days: -1 });

// Components props
const props = defineProps<{
  /** The task to edit */
  modelValue: Omit<Task, 'template'>,
}>();

// Utils composables
const { t } = useI18n();

/** Is basic form valid */
const isValid = ref(false);
/** Custom targets */
const targets = ref(props.modelValue.targets);
/** Custom period */
const period = ref({ start: new Date(), end: new Date() });
/** Is the report being generated */
const loading = ref(false);
/** Progress of the generation */
const progress = ref(0);
/** Error in the generation */
const error = ref<{ message: string, cause?: ReportErrorCause } | undefined>();
/** Result of the generation */
const result = ref<ReportResult | undefined>();

/** Formatted period */
const formattedPeriod = computed(() => `${format(period.value.start, 'dd/MM/yyyy')} ~ ${format(period.value.end, 'dd/MM/yyyy')}`);
/** Days in period */
const periodRange = computed(() => eachDayOfInterval(period.value));

function onTargetUpdated(emails: string | string[] | undefined) {
  if (emails == null) {
    targets.value = [];
    return;
  }

  let allTargets = emails;
  if (!Array.isArray(allTargets)) {
    allTargets = [allTargets];
  }

  // Allow multiple mail addresses, separated by semicolon or comma
  targets.value = Array.from(
    new Set(
      allTargets
        .join(';').replace(/[,]/g, ';')
        .split(';').map((mail) => mail.trim()),
    ),
  );
}

/**
 * Get period based on Recurrence
 *
 * @param today The today's date
 * @param offset The offset, negative for previous, positive for next, 0 for current
 */
function calcPeriodFromRecurrence(
  today: Date,
  offset = 0,
): void {
  let value;
  switch (props.modelValue.recurrence) {
    case 'DAILY': {
      const target = add(today, { days: offset });
      value = { start: startOfDay(target), end: endOfDay(target) };
      break;
    }

    case 'WEEKLY': {
      const target = add(today, { weeks: offset });
      value = {
        start: startOfWeek(target, { weekStartsOn: 1 }),
        end: endOfWeek(target, { weekStartsOn: 1 }),
      };
      break;
    }

    case 'MONTHLY': {
      const target = add(today, { months: offset });
      value = { start: startOfMonth(target), end: endOfMonth(target) };
      break;
    }

    case 'QUARTERLY': {
      const target = add(today, { months: 3 * offset });
      value = { start: startOfQuarter(target), end: endOfQuarter(target) };
      break;
    }

    case 'BIENNIAL': {
      const target = add(today, { months: 6 * offset });
      const year = getYear(target);
      const midYear = new Date(year, 5, 30);
      if (isAfter(target, midYear)) {
        value = { start: add(midYear, { days: 1 }), end: endOfYear(midYear) };
        break;
      }
      value = { start: startOfYear(midYear), end: midYear };
      break;
    }

    case 'YEARLY': {
      const target = add(today, { years: offset });
      value = { start: startOfYear(target), end: endOfYear(target) };
      break;
    }

    default:
      throw new Error('Recurrence not found');
  }

  if (isAfter(value.end, maxDate)) {
    return;
  }

  period.value = value;
}

function updatePeriod(range: Date | Date[]) {
  const date = Array.isArray(range) ? max(range) : range;
  if (!isValidDate(date)) {
    return;
  }
  calcPeriodFromRecurrence(date, 0);
}

async function generate() {
  loading.value = true;
  progress.value = 0;
  error.value = undefined;
  result.value = undefined;

  try {
    const generation = generateAndListenReportOfTask(props.modelValue, period.value, targets.value);
    generation.on('progress', (ev) => { progress.value = ev.progress * 100; });

    const res = await generation;
    if (!res.success && res.detail.error) {
      error.value = res.detail.error;
    }

    result.value = res;
  } catch (err) {
    error.value = { message: err instanceof Error ? err.message : `${err}` };
  }
  loading.value = false;
}

async function downloadGenerationFile(path: string) {
  if (!result.value) {
    return;
  }

  try {
    const filename = path.split('/').pop() ?? 'download';
    const blob = await getFileAsBlob(result.value.detail.taskId, path);
    downloadBlob(blob, filename);
  } catch (e) {
    handleEzrError(t('$ezreeport.errors.download', { path }), e);
  }
}

watch(
  () => props.modelValue,
  (v) => v && calcPeriodFromRecurrence(new Date(), -1),
  { immediate: true },
);
</script>
