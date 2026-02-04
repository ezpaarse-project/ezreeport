<template>
  <v-menu
    :disabled="readonly || (recurrence === 'DAILY' && !nextRun)"
    :close-on-content-click="false"
    max-width="500"
  >
    <template #activator="{ props: menu }">
      <v-text-field
        :label="$t('$ezreeport.task.nextRunPicker.label')"
        :model-value="humanLabel"
        :error="errorState?.status"
        :error-messages="errorState?.messages"
        prepend-icon="mdi-calendar-arrow-right"
        variant="underlined"
        v-bind="menu"
      />
    </template>

    <v-card>
      <template #text>
        <v-row v-if="recurrence !== 'DAILY'">
          <v-col v-if="recurrence === 'WEEKLY'" cols="12">
            <v-btn-toggle
              v-model="offsetDaysValue"
              :disabled="readonly"
              color="primary"
              mandatory
            >
              <v-btn
                v-for="day in weekDayOptions.days"
                :key="day.text"
                :value="day.value"
                :text="day.text"
              />
            </v-btn-toggle>
          </v-col>

          <template v-else>
            <v-col v-if="recurrence !== 'MONTHLY'" cols="12">
              <v-btn-toggle
                v-model="offsetMonthsValue"
                :disabled="readonly"
                color="primary"
                mandatory
              >
                <v-btn
                  v-for="month in monthOptions.months"
                  :key="month.text"
                  :value="month.value"
                  :text="month.text"
                />
              </v-btn-toggle>
            </v-col>

            <v-col cols="12" class="monthly-picker">
              <div v-for="day in monthOptions.days" :key="day.value">
                <v-btn
                  :text="day.text"
                  :color="offsetDaysValue === day.value ? 'primary' : undefined"
                  :disabled="readonly"
                  variant="flat"
                  rounded
                  @click="offsetDaysValue = day.value"
                />
              </div>
            </v-col>
          </template>
        </v-row>

        <v-divider v-if="recurrence !== 'DAILY' && nextRun" class="my-2" />

        <v-row v-if="nextRun">
          <v-col>
            <DateField
              v-model="nextRun"
              :label="$t('$ezreeport.task.nextRun')"
              :loading="nextDateResolving"
              :disabled="nextDateResolving"
              :min="today"
              prepend-icon="mdi-calendar-start"
              variant="underlined"
            />
          </v-col>
        </v-row>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { Day, Month } from 'date-fns';
import { daysInWeek, monthsInQuarter, monthsInYear } from 'date-fns/constants';

import type { TaskRecurrenceOffset } from '~sdk/tasks';
import {
  type Recurrence,
  type RecurrenceOffset,
  getNextDateFromRecurrence,
} from '~sdk/recurrence';

const today = new Date();
// date-fns is missing the "semester" granularity
const monthsInSemester = 6;
// we want a general rule, so we want the maximum days in a month
const daysInMonth = 31;

const nextRun = defineModel<Date | undefined>();

const offset = defineModel<RecurrenceOffset>('offset', {
  required: true,
});

// Components props
const { recurrence, rules } = defineProps<{
  /** Task's recurrence */
  recurrence: Recurrence;
  /** Should be readonly */
  readonly?: boolean;
  /** Rules */
  rules?: ((val: Date) => string | boolean)[];
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();
const { locale: dateLocale } = useDateLocale();

/** Is nextDate resolving */
const nextDateResolving = shallowRef(false);

const offsetDaysValue = computed({
  get: () => offset.value.days ?? 0,
  set: (days) => {
    offset.value = { ...offset.value, days };
  },
});

const offsetMonthsValue = computed({
  get: () => offset.value.months ?? 0,
  set: (months) => {
    offset.value = { ...offset.value, months };
  },
});

const weekDayOptions = computed(() => {
  const startsOn = dateLocale.value.options?.weekStartsOn ?? 0;

  return {
    days: Array.from({ length: daysInWeek }, (__, index) => {
      const day = ((startsOn + index) % daysInWeek) as Day;
      return {
        value: index,
        text: dateLocale.value.localize.day(day),
      };
    }),
  };
});

const monthOptions = computed(() => {
  let numberOfMonths = 0;
  if (recurrence === 'QUARTERLY') {
    numberOfMonths = monthsInQuarter;
  }
  if (recurrence === 'BIENNIAL') {
    numberOfMonths = monthsInSemester;
  }
  if (recurrence === 'YEARLY') {
    numberOfMonths = monthsInYear;
  }

  return {
    days: Array.from({ length: daysInMonth }, (__, day) => ({
      value: day,
      text: `${day + 1}`,
    })),

    months: Array.from({ length: numberOfMonths }, (__, month) => ({
      value: month,
      text:
        recurrence === 'YEARLY'
          ? dateLocale.value.localize.month(month as Month)
          : t('$ezreeport.task.nextRunPicker.month:list', month + 1),
    })),
  };
});

const humanLabel = computed(() => {
  const { days, months } = monthOptions.value;

  let { text: day } =
    days.find(({ value }) => value === offsetDaysValue.value) ?? {};

  let { text: month } =
    months.find(({ value }) => value === offsetMonthsValue.value) ?? {};

  if (recurrence === 'DAILY') {
    day = t('$ezreeport.task.nextRunPicker.days');
    month = '';
  } else if (recurrence === 'WEEKLY') {
    day =
      weekDayOptions.value.days.find(
        ({ value }) => value === offsetDaysValue.value
      )?.text || '';
    month = '';
  } else if (recurrence === 'MONTHLY') {
    month = t('$ezreeport.task.nextRunPicker.months');
  }

  let key =
    day && month
      ? '$ezreeport.task.nextRunPicker.text'
      : '$ezreeport.task.nextRunPicker.text:day';

  return key ? t(key, { day, month }) : '';
});

const errorState = computed(() => {
  if (!nextRun.value) {
    return;
  }

  const { value } = nextRun;
  const messages =
    rules
      ?.map((rule) => rule(value))
      ?.filter((res) => typeof res === 'string') ?? [];

  return {
    status: messages.length > 0,
    messages,
  };
});

function resetOffset(previousRecurrence: Recurrence | undefined): void {
  if (previousRecurrence === recurrence) {
    return;
  }

  offset.value = {};
}

async function updateNextDate(): Promise<void> {
  if (!nextRun.value) {
    return;
  }

  nextDateResolving.value = true;
  try {
    nextRun.value = await getNextDateFromRecurrence(
      recurrence,
      today,
      offset.value
    );
  } catch (err) {
    handleEzrError(t('$ezreeport.errors.resolveNextDate'), err);
  }
  nextDateResolving.value = false;
}

watch(
  (): Recurrence => recurrence,
  (__, previous) => {
    resetOffset(previous);
  }
);
watch(
  (): [Recurrence, TaskRecurrenceOffset] => [recurrence, offset.value],
  () => {
    updateNextDate();
  },
  { immediate: true }
);
</script>

<style lang="css" scoped>
.monthly-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;

  text-align: center;
}
</style>
