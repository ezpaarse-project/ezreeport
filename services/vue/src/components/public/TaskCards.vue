<template>
  <v-data-iterator
    :items="tasks"
    items-per-page="0"
    show-select
    return-object
    item-value="id"
  >
    <template #header>
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
            :text="$t('$ezreeport.new')"
            variant="tonal"
            color="green"
            prepend-icon="mdi-plus"
            class="ml-2"
            @click="openForm()"
          />

          <v-btn
            :text="$t('$ezreeport.refresh')"
            :loading="loading"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-refresh"
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
              prepend-icon="mdi-filter"
              variant="tonal"
              color="primary"
              class="ml-2"
              @click="isFiltersPanelOpen = true"
            />
          </v-badge>

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

      <v-tabs
        v-model="currentFilterTab"
        :items="filterTabs"
        color="primary"
        @update:model-value="onTabChange(`${$event}`)"
      >
        <template v-slot:tab="{ item }">
          <v-divider v-if="'separator' in item" vertical class="mx-2" />
          <v-tab v-else :text="item.text" :value="item.value" />
        </template>
      </v-tabs>
    </template>

    <template #default="{ items }">
      <v-container fluid>
        <v-row class="mt-1">
          <v-col
            v-for="{ raw: task } in items"
            :key="task.id"
            cols="12"
            sm="6"
            md="4"
          >
            <TaskCard :model-value="task">
              <template #actions>
                <v-switch
                  :model-value="task.enabled"
                  :label="
                    task.enabled
                      ? $t('$ezreeport.task.enabled')
                      : $t('$ezreeport.task.disabled')
                  "
                  :disabled="!availableActions.state"
                  :loading="loading"
                  density="comfortable"
                  color="primary"
                  hide-details
                  class="ml-1"
                  @update:model-value="toggleItemState(task)"
                />

                <v-spacer />

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
                      @click="openGeneration(task)"
                    />

                    <v-list-item
                      :title="$t('$ezreeport.duplicate')"
                      :disabled="!availableActions.create"
                      prepend-icon="mdi-content-copy"
                      @click="openCopyForm(task)"
                    />

                    <v-divider />

                    <v-list-item
                      :title="$t('$ezreeport.edit')"
                      :disabled="!availableActions.update"
                      prepend-icon="mdi-pencil"
                      @click="openForm(task)"
                    />

                    <v-list-item
                      :title="$t('$ezreeport.delete')"
                      :disabled="!availableActions.delete"
                      prepend-icon="mdi-delete"
                      @click="deleteItem(task)"
                    />
                  </v-list>
                </v-menu>
              </template>
            </TaskCard>
          </v-col>
        </v-row>
      </v-container>
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
  </v-data-iterator>

  <TaskApiFiltersPanel
    v-model="isFiltersPanelOpen"
    v-model:filters="filters"
    :tags="allTags"
    @reset:filters="filters = { namespaceId: props.namespaceId }"
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
        :namespace-id="namespaceId"
        @update:model-value="onAdvancedSave($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TaskForm>

      <TaskEditionForm
        v-else-if="updatedTask"
        :model-value="updatedTask"
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
        :namespace-id="namespaceId"
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
import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import type { AdditionalDataForPreset, TaskPreset } from '~sdk/task-presets';
import { generateAndListenReportOfTask } from '~sdk/helpers/generations';
import type { TemplateTag } from '~sdk/templates';
import {
  RECURRENCES,
  changeTaskEnableState,
  createTaskHelper,
  createTaskBodyHelper,
  createTaskHelperFrom,
  taskHelperToJSON,
  type TaskHelper,
  isRecurrence,
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

// Components props
const props = defineProps<{
  namespaceId: string;
  titlePrefix?: string;
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

const arePermissionsReady = shallowRef(false);
const updatedTask = ref<Task | undefined>();
const generatedTask = ref<Omit<Task, 'template'> | undefined>();
const isFormOpen = shallowRef(false);
const advancedTask = ref<TaskHelper | undefined>();
const currentFilterTab = shallowRef('all');
const isFiltersPanelOpen = shallowRef(false);
const tagMap = ref(new Map<string, TemplateTag>());

/** List of tasks */
const {
  total,
  refresh,
  loading,
  filters,
  items: tasks,
} = useServerSidePagination((params) => getAllTasks(params), {
  sortBy: 'name',
  include: ['extends.tags'],
  itemsPerPage: 0,
  filters: { namespaceId: props.namespaceId },
});

const title = computed(
  () =>
    `${props.titlePrefix || ''}${t('$ezreeport.task.title:list', total.value)}`
);

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

const allTags = computed(() => [...tagMap.value.values()]);

const filterCount = computed(
  () => Object.entries(filters.value).filter(([, val]) => !!val).length - 1
);

const filterTabs = computed(() => [
  { value: 'all', text: t('$ezreeport.all') },
  { separator: true },
  ...RECURRENCES.map((value) => ({
    value,
    text: t(`$ezreeport.task.recurrenceList.${value}`),
  })),
  { separator: true },
]);

function onTabChange(tab: string): void {
  filters.value.recurrence = isRecurrence(tab) ? tab : undefined;
}

async function openForm(task?: Omit<Task, 'template'>): Promise<void> {
  try {
    advancedTask.value = undefined;
    generatedTask.value = undefined;
    updatedTask.value = task && (await getTask(task));

    isFormOpen.value = true;
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.open'), err);
  }
}

async function openCopyForm(task: Omit<Task, 'template'>): Promise<void> {
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
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.open'), err);
  }
}

function openGeneration(task: Omit<Task, 'template'>): void {
  try {
    advancedTask.value = undefined;
    generatedTask.value = task;
    updatedTask.value = undefined;

    isFormOpen.value = true;
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.open'), err);
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
        data.filters
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
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.open'), err);
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
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.edit'), err);
  }
}

async function deleteItem(task: Omit<Task, 'template'>): Promise<void> {
  // TODO: show warning
  try {
    await deleteTask(task);
    refresh();
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.delete'), err);
  }
}

async function onAdvancedSave(task: TaskHelper): Promise<void> {
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
  } catch (err) {
    const msg = task.id
      ? t('$ezreeport.task.errors.edit')
      : t('$ezreeport.task.errors.create');
    handleEzrError(msg, err);
  }
}

watch(tasks, () => {
  const entries = [
    ...tagMap.value,
    ...tasks.value.flatMap((task) =>
      (task.extends?.tags ?? []).map((tag): [string, TemplateTag] => [
        tag.name,
        tag,
      ])
    ),
  ];

  tagMap.value = new Map(entries);
});

// watch(
//   () => filters.value.recurrence,
//   (val) => {
//     if (!val) {
//       currentFilterTab.value = 'all';
//       return;
//     }

//     const isTab = filterTabs.value.some((tab) => tab.value === val);
//     if (isTab && currentFilterTab.value !== val) {
//       currentFilterTab.value = `${val}`;
//     }
//   }
// );

// oxlint-disable-next-line promise/catch-or-return, promise/prefer-await-to-then
refreshPermissions().then(() => {
  arePermissionsReady.value = true;
});
</script>
