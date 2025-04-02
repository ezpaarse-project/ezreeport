<template>
  <v-data-table-server
    v-bind="vDataTableOptions"
    :headers="headers"
    item-value="id"
    density="compact"
    show-expand
  >
    <template #top>
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
          <v-menu :close-on-content-click="false" location="bottom start">
            <template #activator="{ props: menu }">
              <v-text-field
                :model-value="formattedPeriod"
                :placeholder="$t('$ezreeport.task-activity.period')"
                append-inner-icon="mdi-calendar-range"
                variant="outlined"
                density="compact"
                width="300"
                hide-details
                readonly
                clearable
                class="ml-2"
                @click:clear="periodRange = undefined"
                v-bind="menu"
              />
            </template>

            <v-card>
              <template #text>
                <v-date-picker
                  v-model="periodRange"
                  :max="maxDate"
                  multiple="range"
                  hide-header
                />
              </template>
            </v-card>
          </v-menu>

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
    </template>

    <template #[`header.task.name`]="{ column }">
      {{ column.title }}

      <v-btn
        v-if="filters.taskId"
        icon="mdi-filter-off"
        color="primary"
        size="small"
        variant="text"
        density="comfortable"
        class="ml-1"
        @click="applyTaskFilter(undefined)"
      />
    </template>

    <template #[`header.task.namespace.name`]="{ column }">
      {{ column.title }}

      <v-btn
        v-if="filters.namespaceId"
        icon="mdi-filter-off"
        color="primary"
        size="small"
        variant="text"
        density="comfortable"
        class="ml-1"
        @click="filters.namespaceId = undefined"
      />
    </template>

    <template #[`item.task.name`]="{ value, item }">
      {{ value }}

      <v-btn
        v-if="!filters.taskId"
        icon="mdi-filter"
        color="primary"
        size="small"
        variant="text"
        density="comfortable"
        class="ml-1"
        @click="applyTaskFilter(item.task?.id || undefined)"
      />
    </template>

    <template #[`item.task.namespace.name`]="{ value, item }">
      {{ value }}

      <v-btn
        v-if="!filters.namespaceId && !filters.taskId"
        icon="mdi-filter"
        color="primary"
        size="small"
        variant="text"
        density="comfortable"
        class="ml-1"
        @click="filters.namespaceId = item.task?.namespace?.id || undefined"
      />
    </template>

    <template #[`item.type`]="{ item }">
      <TaskActivityTypeChip :model-value="item" />
    </template>

    <template #[`item.data`]="{ item }">
      <TaskActivityDataChips :model-value="item" />
    </template>

    <template #[`item.createdAt`]="{ value }">
      <LocalDate :model-value="value" format="PPPpp" />
    </template>

    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length">
          <v-row class="my-1">
            <v-col>
              <div class="font-weight-bold">{{ $t('$ezreeport.task-activity.message') }}</div>
              {{ item.message }}
            </v-col>

            <v-col cols="4">
              <div class="font-weight-bold">{{ $t('$ezreeport.task-activity.meta') }}</div>
              <TaskActivityDataChips :model-value="item" />
            </v-col>
          </v-row>
        </td>
      </tr>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import type { VDataTable } from 'vuetify/components';
import {
  eachDayOfInterval,
  format,
  formatISO,
  isValid,
  max,
  min,
} from 'date-fns';

import { getAllActivity } from '~sdk/task-activity';

const maxDate = new Date();

// Components props
const props = defineProps<{
  titlePrefix?: string;
}>();

/** List of activity */
const {
  total,
  refresh,
  loading,
  filters,
  vDataTableOptions,
} = useServerSidePagination(
  (params) => getAllActivity(params),
  {
    sortBy: 'createdAt',
    order: 'desc',
    itemsPerPage: 25,
    include: ['task.namespace'],
  },
);

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

// Utils composable
const { t } = useI18n();
const { locale } = useDateLocale();

const title = computed(() => `${props.titlePrefix || ''}${t('$ezreeport.task-activity.title:list', total.value)}`);

/** Headers for table */
const headers = computed((): VDataTableHeaders => [
  {
    title: t('$ezreeport.task-activity.task'),
    value: 'task.name',
  },
  {
    title: t('$ezreeport.namespace'),
    value: 'task.namespace.name',
  },
  {
    title: t('$ezreeport.task-activity.type'),
    value: 'type',
    align: 'center',
  },
  {
    title: t('$ezreeport.task-activity.date'),
    value: 'createdAt',
    sortable: true,
  },
]);

const periodRange = computed({
  get: () => {
    const start = new Date(`${filters.value['createdAt.from']}`);
    const end = new Date(`${filters.value['createdAt.to']}`);

    if (!isValid(start)) {
      return undefined;
    }
    if (!isValid(end)) {
      return [start];
    }
    return eachDayOfInterval({ start, end });
  },
  set: (range) => {
    if (!range || range.length <= 0) {
      filters.value['createdAt.from'] = undefined;
      filters.value['createdAt.to'] = undefined;
      return;
    }
    const start = min(range);
    filters.value['createdAt.from'] = formatISO(start, { representation: 'date' });
    const end = max(range);
    filters.value['createdAt.to'] = formatISO(end, { representation: 'date' });
  },
});

const formattedPeriod = computed(() => {
  const start = new Date(`${filters.value['createdAt.from']}`);
  const end = new Date(`${filters.value['createdAt.to']}`);

  const period = { start: '', end: '' };
  if (isValid(start)) {
    period.start = format(start, 'dd/MM/yyyy', { locale: locale.value });
  }
  if (isValid(end)) {
    period.end = format(end, 'dd/MM/yyyy', { locale: locale.value });
  }
  if (!period.start) {
    return undefined;
  }
  if (period.start === period.end) {
    return period.start;
  }
  return `${period.start} ~ ${period.end}`;
});

function applyTaskFilter(id: string | undefined) {
  filters.value.namespaceId = undefined;
  filters.value.taskId = id;
}
</script>
