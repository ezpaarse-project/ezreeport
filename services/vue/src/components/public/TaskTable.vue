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
          <v-btn
            v-if="availableActions.create"
            v-tooltip:top="$t('$ezreeport.new')"
            variant="tonal"
            color="green"
            icon="mdi-plus"
            density="comfortable"
            class="ml-2"
            @click="openForm()"
          />

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

          <v-text-field
            v-model="filters.query"
            :placeholder="$t('$ezreeport.search')"
            append-inner-icon="mdi-magnify"
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
      <TemplateTagView v-if="item.extends?.tags" :model-value="item.extends.tags" size="x-small" />
    </template>

    <template #[`item.recurrence`]="{ value }">
      <v-chip
        :text="$t(`$ezreeport.task.recurrenceList.${value}`)"
        color="primary"
        variant="outlined"
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
        prepend-icon="mdi-calendar-end"
      >
        <LocalDate :model-value="value" format="PPP" />
      </v-chip>
    </template>

    <template #[`item.nextRun`]="{ value, item }">
      <v-chip
        v-if="value && item.enabled"
        variant="outlined"
        size="small"
        prepend-icon="mdi-calendar-start"
      >
        <LocalDate :model-value="value" format="PPP" />
      </v-chip>
    </template>

    <template #[`item.enabled`]="{ value, item }">
      <v-switch
        :model-value="value"
        :label="value
          ? $t('$ezreeport.task.enabled')
          : $t('$ezreeport.task.disabled')"
        :disabled="!availableActions.state"
        :loading="loading"
        density="comfortable"
        color="primary"
        hide-details
        style="transform: scale(0.8);"
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
            icon="mdi-cog"
            variant="plain"
            density="comfortable"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.task.generate')"
            :disabled="!availableActions.generate"
            prepend-icon="mdi-email-fast"
            @click="openGeneration(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.duplicate')"
            :disabled="!availableActions.create"
            prepend-icon="mdi-content-copy"
            @click="openDuplicateForm(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            prepend-icon="mdi-pencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="!availableActions.delete"
            prepend-icon="mdi-delete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #[`item.data-table-expand`]="{ internalItem, toggleExpand, isExpanded }">
      <v-btn
        v-if="internalItem.raw.description"
        :icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
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
        icon="mdi-email-off"
      >
        <template #actions>
          <v-btn
            v-if="availableActions.create"
            :text="$t('$ezreeport.new')"
            color="green"
            append-icon="mdi-plus"
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
        prepend-icon="mdi-delete"
        @click="deleteSelected()"
      />

      <v-divider />

      <v-list-item
        v-if="availableActions.state"
        :title="$t('$ezreeport.task.state:toggle')"
        prepend-icon="mdi-toggle-switch"
        @click="toggleSelectedState()"
      />
    </template>
  </SelectionMenu>

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
        @open:advanced="openAdvancedForm({ update: { data: $event, raw: updatedTask } })"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskEditionForm>

      <TaskGenerationForm v-else-if="generatedTask" :model-value="generatedTask">
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

import type { AdditionalDataForPreset, TaskPreset } from '~sdk/task-presets';
import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import { generateAndListenReportOfTask } from '~sdk/helpers/jobs';
import {
  changeTaskEnableState,
  createTaskHelper,
  createTaskBodyHelper,
  createTaskHelperFrom,
  taskHelperToJSON,
  type TaskHelper,
} from '~sdk/helpers/tasks';
import {
  getAllTasks,
  getTask,
  createTask,
  upsertTask,
  deleteTask,
  type Task,
  type InputTask,
} from '~sdk/tasks';

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

// Components props
const props = defineProps<{
  titlePrefix?: string;
  itemsPerPageOptions?: number[] | { title: string; value: number }[];
  itemsPerPage?: number;
}>();

// Components events
const emit = defineEmits<{
  (e: 'update:itemsPerPage', value: number): void
}>();

// Utils composable
const { t } = useI18n();

const arePermissionsReady = ref(false);
const selectedTasks = ref<Omit<Task, 'template'>[]>([]);
const updatedTask = ref<Task | undefined>();
const generatedTask = ref<Omit<Task, 'template'> | undefined>();
const isFormOpen = ref(false);
const advancedTask = ref<TaskHelper | undefined>();

/** Items per page shortcut */
const itemsPerPage = computed({ get: () => props.itemsPerPage || 10, set: (v) => emit('update:itemsPerPage', v) });
/** List of tasks */
const {
  total,
  refresh,
  loading,
  filters,
  vDataTableOptions,
} = useServerSidePagination(
  (params) => getAllTasks(params),
  { sortBy: 'name', itemsPerPage, include: ['extends.tags', 'namespace'] },
);

const title = computed(() => `${props.titlePrefix || ''}${t('$ezreeport.task.title:list', total.value)}`);

/** Headers for table */
const headers = computed((): VDataTableHeaders => [
  {
    title: t('$ezreeport.name'),
    value: 'name',
    sortable: true,
  },
  {
    title: t('$ezreeport.task.recurrence'),
    value: 'recurrence',
    sortable: true,
    align: 'center',
  },
  {
    title: t('$ezreeport.namespace'),
    value: 'namespace',
  },
  {
    title: t('$ezreeport.task.targets'),
    value: 'targets',
    align: 'center',
  },
  {
    title: t('$ezreeport.task.lastRun'),
    value: 'lastRun',
    sortable: true,
    align: 'center',
  },
  {
    title: t('$ezreeport.task.nextRun'),
    value: 'nextRun',
    sortable: true,
    align: 'center',
  },
  {
    title: t('$ezreeport.task.state'),
    value: 'enabled',
    sortable: true,
    align: 'center',
    minWidth: '175px',
  },
  {
    title: t('$ezreeport.updatedAt'),
    value: 'updatedAt',
    sortable: true,
  },
  {
    title: t('$ezreeport.actions'),
    value: '_actions',
    align: 'center',
  },
]);

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    create: hasPermission(createTask),
    update: hasPermission(upsertTask),
    delete: hasPermission(deleteTask),

    generate: hasPermission(generateAndListenReportOfTask),
    state: hasPermission(changeTaskEnableState),
  };
});

const selectedTaskIds = computed({
  get: () => selectedTasks.value.map((task) => task.id),
  set: (v) => {
    const ids = new Set(v);
    selectedTasks.value = selectedTasks.value.filter(
      (task) => ids.has(task.id),
    );
  },
});

async function openForm(task?: Omit<Task, 'template'>) {
  try {
    advancedTask.value = undefined;
    generatedTask.value = undefined;
    updatedTask.value = task && await getTask(task);

    isFormOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.open'), e);
  }
}

async function openGeneration(task: Omit<Task, 'template'>) {
  advancedTask.value = undefined;
  generatedTask.value = task;
  updatedTask.value = undefined;

  isFormOpen.value = true;
}

async function openDuplicateForm(task: Omit<Task, 'template'>) {
  try {
    const base = await getTask(task);

    advancedTask.value = undefined;
    generatedTask.value = undefined;
    updatedTask.value = {
      ...base,
      name: `${base.name} (copy)`,
      id: '',
    };

    isFormOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.open'), e);
  }
}

/** Type to hold data from others forms */
type AdvancedFormCurrent = {
  create?: {
    data: AdditionalDataForPreset,
    preset?: TaskPreset,
  }
  update?: {
    data: InputTask,
    raw: Task,
  }
};

async function openAdvancedForm(current?: AdvancedFormCurrent) {
  try {
    let value: TaskHelper;

    if (current?.update) {
      const { data, raw } = current.update;

      value = createTaskHelperFrom({
        id: raw.id,
        createdAt: raw.createdAt,
        ...data,
      });
    } else if (current?.create) {
      const { data, preset } = current.create;

      const template = createTaskBodyHelper(
        data.index || preset?.fetchOptions.index,
        preset?.fetchOptions.dateField,
        undefined,
        data.filters,
      );

      value = createTaskHelper(
        data.name,
        data.description,
        data.namespaceId,
        preset?.templateId,
        template,
        data.targets,
        preset?.recurrence,
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
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.open'), e);
  }
}

function closeForm() {
  isFormOpen.value = false;
  refresh();
}

async function toggleItemState(task: Omit<Task, 'template'>) {
  try {
    await changeTaskEnableState(task, !task.enabled);
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.edit'), e);
  }
}

async function toggleSelectedState() {
  try {
    await Promise.all(selectedTasks.value.map(
      (task) => changeTaskEnableState(task, !task.enabled),
    ));
    selectedTasks.value = [];
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.edit'), e);
  }
}

async function deleteItem(task: Omit<Task, 'template'>) {
  // TODO: show warning
  try {
    await deleteTask(task);
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.delete'), e);
  }
}

async function deleteSelected() {
  // TODO: show warning
  try {
    await Promise.all(selectedTasks.value.map((task) => deleteTask(task)));
    selectedTasks.value = [];
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.delete'), e);
  }
}

async function onAdvancedSave(task: TaskHelper) {
  try {
    let result;
    const data = taskHelperToJSON(task);
    if (task.id) {
      result = await upsertTask({ ...data, id: task.id });
    } else {
      result = await createTask(data);
    }
    openAdvancedForm({
      update: {
        data,
        raw: result,
      },
    });
  } catch (e) {
    const msg = task.id ? t('$ezreeport.task.errors.edit') : t('$ezreeport.task.errors.create');
    handleEzrError(msg, e);
  }
}

refreshPermissions()
  .then(() => { arePermissionsReady.value = true; });
</script>
