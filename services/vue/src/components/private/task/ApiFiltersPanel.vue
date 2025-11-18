<template>
  <teleport to=".v-application" defer>
    <v-navigation-drawer
      v-model="modelValue"
      location="right"
      width="500"
      temporary
    >
      <v-toolbar
        :title="$t('$ezreeport.api-filters.tasks.title')"
        style="background-color: transparent"
      >
        <template #prepend>
          <v-icon icon="mdi-email" end />
        </template>

        <template #append>
          <v-btn
            v-tooltip="$t('$ezreeport.api-filters.reset')"
            icon="mdi-filter-off"
            @click="$emit('reset:filters')"
          />

          <v-btn icon="mdi-close" @click="modelValue = false" />
        </template>
      </v-toolbar>

      <v-container>
        <v-row>
          <v-col cols="6">
            <ApiFiltersButtonsGroup
              v-model="filters.enabled"
              :items="enabledOptions"
              :label="$t('$ezreeport.task.state')"
              prepend-icon="mdi-toggle-switch"
            />
          </v-col>

          <v-col cols="6">
            <ApiFiltersSelect
              v-model="filters.recurrence"
              :items="recurrenceOptions"
              :label="$t('$ezreeport.task.recurrence')"
              prepend-icon="mdi-calendar-refresh"
              clearable
            />
          </v-col>

          <v-col v-if="tags.length > 0" cols="12">
            <ApiFiltersSelect
              v-model="filters['extends.tags']"
              :items="tagsOptions"
              :label="$t('$ezreeport.template.tags.title')"
              prepend-icon="mdi-tag"
              clearable
              chips
              multiple
              allow-empty
            >
              <template #chip="{ item: { raw } }">
                <TemplateTagChip :model-value="(raw as any).tag" />
              </template>
            </ApiFiltersSelect>
          </v-col>

          <v-col v-if="namespaces.length > 0" cols="12">
            <ApiFiltersSelect
              v-model="filters.namespaceId"
              :items="namespacesOptions"
              :label="$t('$ezreeport.namespace')"
              prepend-icon="mdi-folder"
              clearable
              chips
              multiple
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
  </teleport>
</template>

<script setup lang="ts">
import { RECURRENCES } from '~sdk/helpers/tasks';
import type { Namespace } from '~sdk/namespaces';
import type { Recurrence } from '~sdk/recurrence';
import type { TemplateTag } from '~sdk/templates';

type TaskFilters = {
  namespaceId?: string[];
  ['nextRun.from']?: Date;
  ['nextRun.to']?: Date;
  enabled?: boolean;
  ['extends.tags']?: string[];
  recurrence?: Recurrence;
};

// Component props
const modelValue = defineModel<boolean>({ required: true });
const filters = defineModel<TaskFilters>('filters', { default: () => ({}) });

const { tags = [], namespaces = [] } = defineProps<{
  tags?: TemplateTag[];
  namespaces?: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[];
}>();

defineEmits<{
  'reset:filters': [];
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

const enabledOptions = computed(() => [
  { value: true, text: t('$ezreeport.task.enabled') },
  { value: false, text: t('$ezreeport.task.disabled') },
]);
const recurrenceOptions = computed(() =>
  RECURRENCES.map((recurrence) => ({
    value: recurrence,
    title: t(`$ezreeport.task.recurrenceList.${recurrence}`),
  }))
);
const tagsOptions = computed(() =>
  tags.map((tag) => ({
    value: tag.id,
    title: tag.name,
    tag,
  }))
);
const namespacesOptions = computed(() =>
  namespaces.map((namespace) => ({
    value: namespace.id,
    title: namespace.name,
    namespace,
  }))
);
</script>
