<template>
  {{ debug }}

  <div v-if="recurrence === 'WEEKLY'">
    <p>Vous voulez recevoir votre rapport chaque {{ formattedWeekDay }}.</p>

    <v-btn-toggle
      v-model="selectedWeekDay"
      :disabled="readonly"
      color="primary"
      mandatory
    >
      <v-btn
        v-for="day in weekDays"
        :key="day.text"
        :value="day.value"
        :text="day.text"
      />
    </v-btn-toggle>
  </div>

  <div v-else-if="recurrence === 'MONTHLY'">
    <p>
      Vous voulez recevoir votre rapport le {{ formattedMonthDate }} de chaque
      mois.
    </p>

    <div color="primary" mandatory class="monthly-picker">
      <v-btn
        v-for="day in monthDates"
        :key="day.text"
        :text="day.text"
        :color="selectedMonthDate === day.value ? 'primary' : undefined"
        :disabled="readonly"
        variant="flat"
        @click="selectedMonthDate = day.value"
      />
    </div>
  </div>

  <div v-else-if="recurrence === 'QUARTERLY'">
    <p>
      Vous voulez recevoir votre rapport le {{ formattedMonthDate }} du
      {{ formattedQuarterMonth }} de chaque trimestre.
    </p>

    <v-btn-toggle
      v-model="selectedQuarterMonth"
      :disabled="readonly"
      color="primary"
      mandatory
    >
      <v-btn
        v-for="quarter in quarterMonths"
        :key="quarter.text"
        :value="quarter.value"
        :text="quarter.text"
      />
    </v-btn-toggle>

    <div color="primary" mandatory class="monthly-picker">
      <v-btn
        v-for="day in monthDates"
        :key="day.text"
        :text="day.text"
        :color="selectedMonthDate === day.value ? 'primary' : undefined"
        :disabled="readonly"
        variant="flat"
        @click="selectedMonthDate = day.value"
      />
    </div>
  </div>

  <v-date-picker
    v-else
    v-model="nextRun"
    :first-day-of-week="firstDayOfWeek"
    :disabled="readonly"
    :min="min"
    :max="max"
  />
</template>

<script setup lang="ts">
import {
  endOfWeek,
  format,
  nextDay,
  startOfWeek,
  eachDayOfInterval,
  startOfMonth,
  setDate,
  startOfYear,
  endOfYear,
  type Day,
  // getQuarter,
  // setQuarter,
  startOfQuarter,
  endOfQuarter,
  eachMonthOfInterval,
  add,
  // formatISO,
  // isBefore,
  // Duration,
  // isAfter,
  // startOfDay,
} from 'date-fns';
import { monthsInQuarter } from 'date-fns/constants';
// import { monthsInQuarter, quartersInYear } from 'date-fns/constants';

import type { TaskRecurrence } from '~sdk/tasks';

// const minDate = add(startOfDay(new Date()), { days: 1 });

/**
 * In monthly recurrence, ezREEPORT adds 1 month to the next run every time a generation is
 * triggered, or February can have only 28 days, so every other date after the 28th will eventually
 * lead to be ran the 28 anyway.
 * Example : 31/10 -> 30/11 -> 30/12 -> 30/01 -> 28/02 -> 28/03
 */
const DAYS_IN_MONTH = 28;

// Components props
defineProps<{
  /** The Date to edit */
  modelValue?: Date;
  /** Task's recurrence */
  recurrence: TaskRecurrence;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
defineEmits<{
  /** Updated Date */
  (event: 'update:modelValue', value: Date): void;
}>();

// Utils composables
const { locale } = useDateLocale();

// Daily shouldn't be shown
// Weekly should ask for which day (Monday, etc.) -> OK
// Monthly should ask for day of the month -> OK
// Quarterly should ask for day of the month, restricted to 3 months ?
// Biennial should ask for day of the month, restricted to 6 months ?
// Yearly is a simple date picker (without year choice)

// const nextRun = computed({
//   get: () => props.modelValue || new Date(),
//   set: (value) => emit('update:modelValue', value),
// });
const nextRun = ref(new Date());

const debug = computed(() =>
  format(nextRun.value, 'yyyy-MM-dd', { locale: locale.value })
);

const formatWeekDay = (date: Date) =>
  format(date, 'EEEE', { locale: locale.value });
const formatMonthDate = (date: Date) =>
  format(date, 'd', { locale: locale.value });
const formatMonth = (month: number) => `${month + 1}e mois`;

const weekDays = computed(() => {
  const start = startOfWeek(nextRun.value, { locale: locale.value });
  const end = endOfWeek(nextRun.value, { locale: locale.value });
  return eachDayOfInterval({ start, end }).map((day) => ({
    value: day.getDay(),
    text: formatWeekDay(day),
  }));
});
const selectedWeekDay = computed({
  get: () => nextRun.value.getDay() as Day,
  set: (value) => {
    nextRun.value = nextDay(nextRun.value, value);
  },
});
const formattedWeekDay = computed(() => formatWeekDay(nextRun.value));

const monthDates = computed(() => {
  const start = startOfMonth(nextRun.value);
  const end = add(start, { days: DAYS_IN_MONTH - 1 });
  return eachDayOfInterval({ start, end }).map((day) => ({
    value: day.getDate(),
    text: format(day, 'd', { locale: locale.value }),
  }));
});
const selectedMonthDate = computed({
  get: () => nextRun.value.getDate(),
  set: (value) => {
    nextRun.value = setDate(nextRun.value, value);
  },
});
const formattedMonthDate = computed(() => formatMonthDate(nextRun.value));

const quarterMonths = computed(() => {
  const start = startOfQuarter(startOfYear(nextRun.value));
  const end = endOfQuarter(start);
  return eachMonthOfInterval({ start, end }).map((month) => ({
    value: month.getMonth(),
    text: formatMonth(month.getMonth()),
  }));
});
const selectedQuarterMonth = computed({
  get: () => nextRun.value.getMonth() % monthsInQuarter,
  set: (value) => {
    const date = add(startOfQuarter(nextRun.value), { months: value });
    nextRun.value = setDate(date, selectedMonthDate.value);
  },
});
const formattedQuarterMonth = computed(() =>
  formatMonth(selectedQuarterMonth.value)
);

const firstDayOfWeek = computed(() =>
  startOfWeek(nextRun.value, { locale: locale.value }).getDay()
);

const min = computed(() => startOfYear(nextRun.value).toISOString());
const max = computed(() => endOfYear(nextRun.value).toISOString());
</script>

<style lang="css" scoped>
.monthly-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}
</style>
