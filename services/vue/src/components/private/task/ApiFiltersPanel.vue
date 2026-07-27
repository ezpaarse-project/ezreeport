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
          <v-icon :icon="mdiEmail" end />
        </template>

        <template #append>
          <v-btn
            v-tooltip="$t('$ezreeport.api-filters.reset')"
            :icon="mdiFilterOff"
            @click="$emit('reset:filters')"
          />

          <v-btn :icon="mdiClose" @click="modelValue = false" />
        </template>
      </v-toolbar>

      <v-container>
        <v-row>
          <v-col cols="6">
            <ApiFiltersButtonsGroup
              v-model="filters.enabled"
              :items="enabledOptions"
              :label="$t('$ezreeport.task.state')"
              :prepend-icon="mdiToggleSwitch"
            />
          </v-col>

          <v-col cols="6">
            <ApiFiltersSelect
              v-model="filters.recurrence"
              :items="recurrenceOptions"
              :label="$t('$ezreeport.task.recurrence')"
              :prepend-icon="mdiCalendarRefresh"
              clearable
            />
          </v-col>

          <v-col v-if="tags.length > 0" cols="12">
            <ApiFiltersSelect
              v-model="filters['extends.tags']"
              :items="tagsOptions"
              :label="$t('$ezreeport.template.tags.title')"
              :prepend-icon="mdiTag"
              clearable
              chips
              multiple
              allow-empty
            >
              <template #chip="{ item }">
                <TemplateTagChip :model-value="(item as any).tag" />
              </template>
            </ApiFiltersSelect>
          </v-col>

          <v-col v-if="namespaces.length > 0" cols="12">
            <ApiFiltersSelect
              v-model="filters.namespaceId"
              :items="namespacesOptions"
              :label="$t('$ezreeport.namespace')"
              :prepend-icon="mdiFolder"
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
  import type { Namespace } from '~sdk/namespaces';
  import type { Recurrence } from '~sdk/recurrence';
  import type { TemplateTag } from '~sdk/templates';
  import {
    mdiCalendarRefresh,
    mdiClose,
    mdiEmail,
    mdiFilterOff,
    mdiFolder,
    mdiTag,
    mdiToggleSwitch,
  } from '@mdi/js';
  import { RECURRENCES } from '~sdk/helpers/tasks';

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
  const { t } = useI18n();

  const enabledOptions = computed(() => [
    { text: t('$ezreeport.task.enabled'), value: true },
    { text: t('$ezreeport.task.disabled'), value: false },
  ]);
  const recurrenceOptions = computed(() =>
    RECURRENCES.map((recurrence) => ({
      title: t(`$ezreeport.task.recurrenceList.${recurrence}`),
      value: recurrence,
    }))
  );
  const tagsOptions = computed(() =>
    tags.map((tag) => ({
      tag,
      title: tag.name,
      value: tag.id,
    }))
  );
  const namespacesOptions = computed(() =>
    namespaces.map((namespace) => ({
      namespace,
      title: namespace.name,
      value: namespace.id,
    }))
  );
</script>
