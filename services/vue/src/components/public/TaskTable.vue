<template>
  <v-data-table-server
    v-model="selectedTasks"
    :headers="headers"
    show-select
    show-expand
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

          <v-badge
            :model-value="filterCount > 0"
            :content="filterCount"
            color="primary"
            offset-x="10"
          >
            <v-btn
              :text="$t('$ezreeport.api-filters.button')"
              variant="tonal"
              color="primary"
              :icon="mdiFilter"
              density="comfortable"
              class="ml-2"
              @click="isFiltersPanelOpen = true"
            />
          </v-badge>

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
        v-if="item.extends?.tags"
        :model-value="item.extends.tags"
        size="x-small"
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

    <template #[`item.extends.locale`]="{ value }">
      <TemplateLocaleFlag
        v-tooltip:left="$t(`$ezreeport.template.locales.${value}`)"
        :modelValue="value"
        size="small"
      />
    </template>

    <template #[`item.namespace`]="{ value, item }">
      <slot name="item.namespace" :namespace="value" :task="item">
        {{ value.name }}
      </slot>
    </template>

    <template #[`item.targets`]="{ value }">
      <TaskTargetsChip :model-value="value" />
    </template>

    <template #[`item.lastRun`]="{ value }">
      <v-chip
        v-if="value"
        variant="outlined"
        size="small"
        :prepend-icon="mdiCalendarEnd"
      >
        <LocalDate :model-value="value" format="PPP" />
      </v-chip>
    </template>

    <template #[`item.nextRun`]="{ value, item }">
      <v-chip
        v-if="value && item.enabled"
        variant="outlined"
        size="small"
        :prepend-icon="mdiCalendarStart"
      >
        <LocalDate :model-value="value" format="PPP" />
      </v-chip>
    </template>

    <template #[`item.enabled`]="{ value, item }">
      <v-switch
        :model-value="value"
        :label="
          value ? $t('$ezreeport.task.enabled') : $t('$ezreeport.task.disabled')
        "
        :disabled="!availableActions.state"
        :loading="loading"
        density="comfortable"
        color="primary"
        hide-details
        style="transform: scale(0.8)"
        @update:model-value="toggleItemState(item)"
      />
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
            density="comfortable"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.task.generate')"
            :disabled="!availableActions.generate"
            :prepend-icon="mdiEmailFast"
            @click="openGeneration(item)"
          />

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

    <template
      #[`item.data-table-expand`]="{ internalItem, toggleExpand, isExpanded }"
    >
      <v-btn
        v-if="internalItem.raw.description"
        :icon="isExpanded(internalItem) ? mdiChevronUp : mdiChevronDown"
        variant="text"
        size="small"
        @click="toggleExpand(internalItem)"
      />
    </template>

    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="py-2">
          {{ item.description }}
        </td>
      </tr>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.task.noList')"
        :text="$t('$ezreeport.task.noList:desc')"
        :icon="mdiEmailOff"
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
    v-model="selectedTaskIds"
    :text="$t('$ezreeport.task.manage', selectedTasks.length)"
  >
    <template #actions>
      <v-list-item
        :title="$t('$ezreeport.delete')"
        :prepend-icon="mdiDelete"
        @click="deleteSelected()"
      />

      <v-divider />

      <v-list-item
        v-if="availableActions.state"
        :title="$t('$ezreeport.task.state:toggle')"
        :prepend-icon="mdiToggleSwitch"
        @click="toggleSelectedState()"
      />
    </template>
  </SelectionMenu>

  <TaskApiFiltersPanel
    v-model="isFiltersPanelOpen"
    v-model:filters="filters"
    :tags="availableTags"
    :namespaces="namespaces"
  />

  <v-dialog
    v-model="isFormOpen"
    :width="advancedTask ? '75%' : '50%'"
    scrollable
    @update:model-value="$event || refresh()"
  >
    <template #default>
      <TaskForm
        v-if="advancedTask"
        v-model="advancedTask"
        @update:model-value="onAdvancedSave($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskForm>

      <TaskEditionForm
        v-else-if="updatedTask"
        :model-value="updatedTask"
        show-namespace
        show-advanced
        @update:model-value="closeForm()"
        @open:advanced="
          openAdvancedForm({ update: { data: $event, raw: updatedTask } })
        "
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskEditionForm>

      <TaskGenerationForm
        v-else-if="generatedTask"
        :model-value="generatedTask"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskGenerationForm>

      <TaskCreationForm
        v-else
        show-advanced
        @update:model-value="closeForm()"
        @open:advanced="openAdvancedForm({ create: $event })"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskCreationForm>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VDataTable } from 'vuetify/components';
  import type { Namespace } from '~sdk/namespaces';
  import type { AdditionalDataForPreset, TaskPreset } from '~sdk/task-presets';
  import {
    mdiCalendarEnd,
    mdiCalendarStart,
    mdiChevronDown,
    mdiChevronUp,
    mdiCog,
    mdiContentCopy,
    mdiDelete,
    mdiEmailFast,
    mdiEmailOff,
    mdiFilter,
    mdiMagnify,
    mdiPencil,
    mdiPlus,
    mdiRefresh,
    mdiToggleSwitch,
  } from '@mdi/js';
  import { getCurrentNamespaces } from '~sdk/auth';
  import { generateAndListenReportOfTask } from '~sdk/helpers/generations';
  import {
    type TaskHelper,
    changeTaskEnableState,
    createTaskBodyHelper,
    createTaskHelper,
    createTaskHelperFrom,
    taskHelperToJSON,
  } from '~sdk/helpers/tasks';
  import {
    type InputTask,
    type Task,
    createTask,
    deleteTask,
    getAllTasks,
    getTask,
    upsertTask,
  } from '~sdk/tasks';
  import { getAllTemplateTags } from '~sdk/template-tags';

  type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

  // Components props
  const props = defineProps<{
    titlePrefix?: string;
    itemsPerPageOptions?: number[] | { title: string; value: number }[];
  }>();

  // Utils composable
  const { t } = useI18n();

  const selectedTasks = ref<Omit<Task, 'template'>[]>([]);
  const updatedTask = ref<Task | undefined>();
  const generatedTask = ref<Omit<Task, 'template'> | undefined>();
  const isFormOpen = shallowRef(false);
  const advancedTask = ref<TaskHelper | undefined>();
  const isFiltersPanelOpen = shallowRef(false);

  const { availableActions } = usePermissions({
    create: [createTask],
    delete: [deleteTask],
    generate: [generateAndListenReportOfTask],
    state: [changeTaskEnableState],
    update: [upsertTask],
  });

  /** Items per page */
  const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
  /** List of tasks */
  const { total, refresh, loading, filters, vDataTableOptions } =
    useServerSidePagination((params) => getAllTasks(params), {
      include: ['extends.tags', 'extends.locale', 'namespace'],
      itemsPerPage,
      sortBy: 'name',
    });
  /** List of possible tags */
  const availableTags = computedAsync(async () => {
    try {
      const { items } = await getAllTemplateTags({ pagination: { count: 0 } });
      return items;
    } catch {
      return [];
    }
  }, []);
  /** List of possible list */
  const namespaces = computedAsync(async () => {
    let items: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[] = [];

    try {
      const currentNamespaces = await getCurrentNamespaces();
      items = currentNamespaces.toSorted((namespaceA, namespaceB) =>
        namespaceA.name.localeCompare(namespaceB.name)
      );
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.fetchNamespaces'), error);
    }

    return items;
  }, []);
  const title = computed(
    () =>
      `${props.titlePrefix || ''}${t('$ezreeport.task.title:list', total.value)}`
  );

  /** Headers for table */
  const headers = computed(
    // oxlint-disable-next-line max-lines-per-function
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
        value: 'extends.locale',
      },
      {
        title: t('$ezreeport.namespace'),
        value: 'namespace',
      },
      {
        align: 'center',
        title: t('$ezreeport.task.targets'),
        value: 'targets',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.task.lastRun'),
        value: 'lastRun',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.task.nextRun'),
        value: 'nextRun',
      },
      {
        align: 'center',
        minWidth: '175px',
        sortable: true,
        title: t('$ezreeport.task.state'),
        value: 'enabled',
      },
      {
        sortable: true,
        title: t('$ezreeport.updatedAt'),
        value: 'updatedAt',
      },
      {
        align: 'center',
        title: t('$ezreeport.actions'),
        value: '_actions',
      },
    ]
  );

  const selectedTaskIds = computed({
    get: () => selectedTasks.value.map((task) => task.id),
    set: (value) => {
      const ids = new Set(value);
      selectedTasks.value = selectedTasks.value.filter((task) =>
        ids.has(task.id)
      );
    },
  });

  const filterCount = computed(
    () =>
      Object.entries(filters.value).filter(([, val]) => Boolean(val)).length - 1
  );

  async function openForm(task?: Omit<Task, 'template'>): Promise<void> {
    try {
      advancedTask.value = undefined;
      generatedTask.value = undefined;
      updatedTask.value = task && (await getTask(task, ['extends.locale']));

      isFormOpen.value = true;
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.open'), error);
    }
  }

  function openGeneration(task: Omit<Task, 'template'>): void {
    advancedTask.value = undefined;
    generatedTask.value = task;
    updatedTask.value = undefined;

    isFormOpen.value = true;
  }

  async function openDuplicateForm(task: Omit<Task, 'template'>): Promise<void> {
    try {
      const base = await getTask(task);

      advancedTask.value = undefined;
      generatedTask.value = undefined;
      updatedTask.value = {
        ...base,
        id: '',
        name: `${base.name} (copy)`,
      };

      isFormOpen.value = true;
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.open'), error);
    }
  }

  /** Type to hold data from others forms */
  type AdvancedFormCurrent = {
    create?: {
      data: AdditionalDataForPreset;
      preset?: TaskPreset;
    };
    update?: {
      data: InputTask;
      raw: Task;
    };
  };

  function openAdvancedForm(current?: AdvancedFormCurrent): void {
    try {
      let value: TaskHelper;

      if (current?.update) {
        const { data, raw } = current.update;

        value = createTaskHelperFrom({
          createdAt: raw.createdAt,
          id: raw.id,
          ...data,
        });
      } else if (current?.create) {
        const { data, preset } = current.create;

        const template = createTaskBodyHelper(
          data.index || preset?.fetchOptions?.index,
          preset?.fetchOptions?.dateField,
          undefined,
          data.filters || preset?.fetchOptions?.filters
        );

        value = createTaskHelper(
          data.name,
          data.description,
          data.namespaceId,
          preset?.templateId,
          template,
          data.targets,
          preset?.recurrence
        );
      } else {
        value = createTaskHelper();
      }

      isFormOpen.value = false;
      setTimeout(() => {
        updatedTask.value = undefined;
        generatedTask.value = undefined;
        advancedTask.value = value;

        isFormOpen.value = true;
      }, 250);
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.open'), error);
    }
  }

  function closeForm(): void {
    isFormOpen.value = false;
    refresh();
  }

  async function toggleItemState(task: Omit<Task, 'template'>): Promise<void> {
    try {
      await changeTaskEnableState(task, !task.enabled);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.edit'), error);
    }
  }

  async function toggleSelectedState(): Promise<void> {
    try {
      await Promise.all(
        selectedTasks.value.map((task) =>
          changeTaskEnableState(task, !task.enabled)
        )
      );
      selectedTasks.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.edit'), error);
    }
  }

  async function deleteItem(task: Omit<Task, 'template'>): Promise<void> {
    // TODO: show warning
    try {
      await deleteTask(task);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.delete'), error);
    }
  }

  async function deleteSelected(): Promise<void> {
    // TODO: show warning
    try {
      await Promise.all(selectedTasks.value.map((task) => deleteTask(task)));
      selectedTasks.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.delete'), error);
    }
  }

  async function onAdvancedSave(task: TaskHelper): Promise<void> {
    try {
      const data = taskHelperToJSON(task);
      const result = task.id
        ? await upsertTask({ ...data, id: task.id })
        : await createTask(data);

      openAdvancedForm({
        update: {
          data,
          raw: result,
        },
      });
    } catch (error) {
      const msg = task.id
        ? t('$ezreeport.task.errors.edit')
        : t('$ezreeport.task.errors.create');
      handleEzrError(msg, error);
    }
  }
</script>
