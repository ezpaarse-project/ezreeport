<template>
  <v-data-table-server
    v-model="selectedTaskPresets"
    :headers="headers"
    show-select
    return-object
    v-bind="vDataTableOptions"
    item-value="id"
  >
    <template #top>
      <v-toolbar :title="title" color="transparent" density="comfortable">
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>

        <template v-if="$slots.title" #title>
          <slot name="title" :title="title" />
        </template>

        <template #append>
          <v-btn
            v-if="availableActions.create"
            v-tooltip:top="$t('$ezreeport.new')"
            variant="tonal"
            color="green"
            :icon="mdiPlus"
            density="comfortable"
            class="ml-2"
            @click="openForm()"
          />

          <v-btn
            v-tooltip:top="$t('$ezreeport.refresh')"
            :loading="loading"
            variant="tonal"
            color="primary"
            :icon="mdiRefresh"
            density="comfortable"
            class="ml-2"
            @click="refresh"
          />

          <v-text-field
            v-model="filters.query"
            :placeholder="$t('$ezreeport.search')"
            :append-inner-icon="mdiMagnify"
            variant="outlined"
            density="compact"
            width="200"
            hide-details
            class="ml-2"
          />
        </template>
      </v-toolbar>
    </template>

    <template #[`item.name`]="{ value, item }">
      {{ value }}
      <TemplateTagView
        v-if="item.template?.tags"
        :model-value="item.template.tags"
        size="x-small"
      />
    </template>

    <template #[`item.template.locale`]="{ value }">
      <TemplateLocaleFlag
        v-tooltip:left="$t(`$ezreeport.template.locales.${value}`)"
        :modelValue="value"
        size="small"
      />
    </template>

    <template #[`item.recurrence`]="{ value }">
      <v-chip
        :text="$t(`$ezreeport.task.recurrenceList.${value}`)"
        color="primary"
        variant="outlined"
        size="small"
      />
    </template>

    <template #[`item.hidden`]="{ value, item }">
      <div
        v-tooltip="
          item.template?.hidden
            ? $t('$ezreeport.task-preset.template-hidden:desc')
            : $t('$ezreeport.task-preset.hidden:desc', value ? 1 : 0)
        "
      >
        <v-btn
          :icon="item.template?.hidden || value ? mdiEyeOff : mdiEye"
          :disabled="item.template?.hidden || !availableActions.visibility"
          variant="plain"
          density="compact"
          @click="toggleItemVisibility(item)"
        />
      </div>
    </template>

    <template #[`item.updatedAt`]="{ value }">
      <LocalDate v-if="value" :model-value="value" />
    </template>

    <template #[`item._actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            :icon="mdiCog"
            variant="plain"
            density="compact"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.duplicate')"
            :disabled="!availableActions.create"
            :prepend-icon="mdiContentCopy"
            @click="openDuplicateForm(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            :prepend-icon="mdiPencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="!availableActions.delete"
            :prepend-icon="mdiDelete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.task-preset.noList')"
        :text="$t('$ezreeport.task-preset.noList:desc')"
        :icon="mdiFileOutline"
      >
        <template #actions>
          <v-btn
            v-if="availableActions.create"
            :text="$t('$ezreeport.new')"
            color="green"
            :append-icon="mdiPlus"
            @click="openForm()"
          />
        </template>
      </v-empty-state>
    </template>
  </v-data-table-server>

  <SelectionMenu
    v-model="selectedTaskPresetIds"
    :text="$t('$ezreeport.task-preset.manage', selectedTaskPresets.length)"
  >
    <template #actions>
      <v-list-item
        :title="$t('$ezreeport.delete')"
        :prepend-icon="mdiDelete"
        @click="deleteSelected()"
      />

      <v-divider />

      <v-list-item
        v-if="availableActions.visibility"
        :title="$t('$ezreeport.task-preset.hidden:toggle')"
        :prepend-icon="mdiEyeOff"
        @click="toggleSelectedVisibility()"
      />
    </template>
  </SelectionMenu>

  <v-dialog
    v-model="isFormOpen"
    width="50%"
    scrollable
    @update:model-value="$event || refresh()"
  >
    <template #default>
      <TaskPresetForm
        :model-value="updatedTaskPreset"
        @update:model-value="closeForm()"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskPresetForm>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VDataTable } from 'vuetify/components';
  import {
    mdiCog,
    mdiContentCopy,
    mdiDelete,
    mdiEye,
    mdiEyeOff,
    mdiFileOutline,
    mdiMagnify,
    mdiPencil,
    mdiPlus,
    mdiRefresh,
  } from '@mdi/js';
  import { changeTaskPresetVisibility } from '~sdk/helpers/task-presets';
  import {
    type TaskPreset,
    createTaskPreset,
    deleteTaskPreset,
    getAllTaskPresets,
    upsertTaskPreset,
  } from '~sdk/task-presets';

  type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

  // Components props
  const props = defineProps<{
    titlePrefix?: string;
    itemsPerPageOptions?: number[] | { title: string; value: number }[];
  }>();

  // Utils composable
  const { t } = useI18n();

  const selectedTaskPresets = ref<TaskPreset[]>([]);
  const updatedTaskPreset = ref<TaskPreset | undefined>();
  const isFormOpen = shallowRef(false);

  const { availableActions } = usePermissions({
    create: [createTaskPreset],
    delete: [deleteTaskPreset],
    update: [upsertTaskPreset],
    visibility: [changeTaskPresetVisibility],
  });

  /** Items per page */
  const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
  /** List of templates */
  const { total, refresh, loading, filters, vDataTableOptions } =
    useServerSidePagination((params) => getAllTaskPresets(params), {
      include: ['template.tags', 'template.locale', 'template.hidden'],
      itemsPerPage,
      itemsPerPageOptions: props.itemsPerPageOptions,
      sortBy: 'name',
    });

  const title = computed(
    () =>
      `${props.titlePrefix || ''}${t('$ezreeport.task-preset.title:list', total.value)}`
  );

  /** Headers for table */
  const headers = computed(
    (): VDataTableHeaders => [
      {
        sortable: true,
        title: t('$ezreeport.name'),
        value: 'name',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.task.recurrence'),
        value: 'recurrence',
      },
      {
        align: 'center',
        title: t('$ezreeport.template.locale'),
        value: 'template.locale',
      },
      {
        sortable: true,
        title: t('$ezreeport.updatedAt'),
        value: 'updatedAt',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.template.hidden'),
        value: 'hidden',
      },
      {
        align: 'center',
        title: t('$ezreeport.actions'),
        value: '_actions',
      },
    ]
  );

  const selectedTaskPresetIds = computed({
    get: () => selectedTaskPresets.value.map((taskPreset) => taskPreset.id),
    set: (value) => {
      const ids = new Set(value);
      selectedTaskPresets.value = selectedTaskPresets.value.filter((taskPreset) =>
        ids.has(taskPreset.id)
      );
    },
  });

  function openForm(taskPreset?: TaskPreset): void {
    updatedTaskPreset.value = taskPreset;

    isFormOpen.value = true;
  }

  function openDuplicateForm(taskPreset: TaskPreset): void {
    updatedTaskPreset.value = {
      ...taskPreset,
      id: '',
    };

    isFormOpen.value = true;
  }

  function closeForm(): void {
    isFormOpen.value = false;
    refresh();
  }

  async function deleteItem(taskPreset: TaskPreset): Promise<void> {
    // TODO: show warning
    try {
      await deleteTaskPreset(taskPreset);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task-preset.errors.delete'), error);
    }
  }

  async function deleteSelected(): Promise<void> {
    // TODO: show warning
    try {
      await Promise.all(
        selectedTaskPresets.value.map((taskPreset) =>
          deleteTaskPreset(taskPreset)
        )
      );
      selectedTaskPresets.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task-preset.errors.delete'), error);
    }
  }

  async function toggleItemVisibility(taskPreset: TaskPreset): Promise<void> {
    try {
      await changeTaskPresetVisibility(taskPreset, !taskPreset.hidden);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task-preset.errors.edit'), error);
    }
  }

  async function toggleSelectedVisibility(): Promise<void> {
    try {
      await Promise.all(
        selectedTaskPresets.value.map((taskPreset) =>
          changeTaskPresetVisibility(taskPreset, !taskPreset.hidden)
        )
      );
      selectedTaskPresets.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task-preset.errors.edit'), error);
    }
  }
</script>
