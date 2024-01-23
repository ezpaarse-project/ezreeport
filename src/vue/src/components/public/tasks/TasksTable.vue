<template>
  <v-col v-if="perms.readAll">
    <TemplateProvider>
      <TaskDialogCreateManager
        v-if="perms.create"
        v-model="createTaskDialogShown"
        @created="onTaskCreated"
      />
      <TaskDialogUpdateManager
        v-if="perms.update && focusedTask"
        v-model="updateTaskDialogShown"
        :task-id="focusedTask.id"
        @updated="onTaskUpdated"
      />
      <TaskDialogReadManager
        v-if="perms.readOne && focusedTask"
        v-model="readTaskDialogShown"
        :task-id="focusedTask.id"
      />
    </TemplateProvider>
    <TaskPopoverDelete
      v-if="focusedTask"
      v-if="perms.delete && focusedTask"
      :coords="deleteTaskPopoverCoords"
      :task="focusedTask"
      @deleted="onTaskDeleted"
    />

    <v-data-table
      :items="taskList"
      :headers="headers"
      :server-items-length="metaList?.total || 0"
      :options.sync="iteratorOptions"
      sort-by="createdAt"
      item-key="id"
      must-sort
      @update:options="fetch()"
    >
      <template #top>
        <LoadingToolbar
          :text="toolbarTitle"
          :loading="loading"
        >
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />

          <v-tooltip top v-if="perms.create">
            <template #activator="{ on, attrs }">
              <v-btn icon color="success" @click="showCreateDialog" v-bind="attrs" v-on="on">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            {{$t('$ezreeport.create')}}
          </v-tooltip>
        </LoadingToolbar>
      </template>

      <template #[`item.name`]="{ value, item }">
        <a
          href="#"
          @click.prevent="showTaskDialog(item)"
          @keyup.enter.prevent="showTaskDialog(item)"
        >
          {{ value }}
        </a>
      </template>

      <template #[`item.namespaceId`]="{ value, item }">
        <slot name="item.namespace" :value="namespaceMap?.[value]" :item="item">
          {{ namespaceMap?.[value]?.name || value }}
        </slot>
      </template>

      <template #[`item.recurrence`]="{ value }">
        <RecurrenceChip :value="value" size="small" />
      </template>

      <template #[`item._count.targets`]="{ value }">
        {{ $tc('targetCount', value) }}
      </template>

      <template #[`item.enabled`]="{ item, value }">
        <v-tooltip :disabled="!item.enabled && !item.lastRun" top>
          <template #activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <CustomSwitch
                :value="value"
                :disabled="!toggleStateMap[item.id]"
                :readonly="loading"
                :label="$t(`$ezreeport.tasks.enabled.${item.enabled}`).toString()"
                hide-details
                dense
                reverse
                class="mb-1"
                style="transform: scale(0.8);"
                @click.stop="toggleTask(item)"
              />
            </div>
          </template>

          <div>
            <DateFormatDiv v-if="item.enabled" :value="item.nextRun" format="dd/MM/yyyy HH:mm">
              <template #default="{ date }">
                {{ $t('dates.nextRun', { date }) }}
              </template>
            </DateFormatDiv>
            <DateFormatDiv v-if="item.lastRun" :value="item.lastRun" format="dd/MM/yyyy HH:mm">
              <template #default="{ date }">
                {{ $t('dates.lastRun', { date }) }}
              </template>
            </DateFormatDiv>
          </div>
        </v-tooltip>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ on, attrs }">
            <v-btn
              :ref="(el) => storeMenuRef(item, el)"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-if="perms.readOne && perms.create"
              @click="duplicateTask(item)"
            >
              <v-list-item-action>
                <v-icon>mdi-content-copy</v-icon>
              </v-list-item-action>

              <v-list-item-title>
                {{ $t('$ezreeport.duplicate') }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item
              v-if="perms.readOne && !perms.update"
              @click="showReadDialog(item)"
            >
              <v-list-item-action>
                <v-icon>mdi-eye</v-icon>
              </v-list-item-action>

              <v-list-item-title>
                {{ $t('$ezreeport.details') }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item v-if="perms.update" @click="showUpdateDialog(item)">
              <v-list-item-action>
                <v-icon color="primary">mdi-pencil</v-icon>
              </v-list-item-action>

              <v-list-item-title>
                {{ $t('$ezreeport.edit') }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item v-if="perms.delete" @click="showDeletePopover(item)">
              <v-list-item-action>
                <v-icon color="error">mdi-delete</v-icon>
              </v-list-item-action>

              <v-list-item-title>
                {{ $t('$ezreeport.delete') }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </v-col>
</template>

<script setup lang="ts">
import type { namespaces, tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { computed, watch, ref } from 'vue';
import type { DataOptions, DataTableHeader } from 'vuetify';
import type { VMenu } from 'vuetify/lib/components';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

type VMenuInstance = InstanceType<typeof VMenu>;

type TaskItem = tasks.TaskList[number];

const { $t, $tc } = useI18n();
const { sdk, ...ezr } = useEzR();

const readTaskDialogShown = ref(false);
const updateTaskDialogShown = ref(false);
const createTaskDialogShown = ref(false);
const deleteTaskPopoverShown = ref(false);
const deleteTaskPopoverCoords = ref({ x: 0, y: 0 });
const loading = ref(false);
const metaList = ref<{
  count: number;
  size: number;
  total: number;
  lastId?: unknown;
}>();
const iteratorOptions = ref<DataOptions | undefined>();
const taskList = ref<tasks.TaskList>([]);
const pageEndsIds = ref<Record<number, string | undefined>>({});
const namespaceMap = ref<Record<string, namespaces.Namespace>>({});
const taskMenusMap = ref<Record<string, VMenuInstance | undefined>>({});
const focusedTask = ref<TaskItem | undefined>(undefined);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;
  return {
    readAll: has('tasks-get', []),
    readOne: has('tasks-get-task', []),
    update: has('tasks-put-task', []),
    create: has('tasks-post', []),
    delete: has('tasks-delete-task', []),
  };
});
const headers = computed<DataTableHeader[]>(() => [
  {
    text: $t('$ezreeport.tasks.name').toString(),
    value: 'name',
  },
  {
    text: ezr.tcNamespace(true),
    value: 'namespaceId',
  },
  {
    text: $t('$ezreeport.tasks.recurrence').toString(),
    value: 'recurrence',
    align: 'center',
  },
  {
    text: $t('$ezreeport.tasks.status').toString(),
    value: 'enabled',
    align: 'center',
  },
  {
    text: $t('$ezreeport.tasks.targets').toString(),
    value: '_count.targets',
    sortable: false,
    align: 'center',
  },
  {
    text: $t('headers.actions').toString(),
    value: 'actions',
    sortable: false,
    align: 'center',
  },
]);
const toggleStateMap = computed(() => {
  const map: Record<string, boolean> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const task of taskList.value) {
    const permissions = ezr.auth.value.permissions?.namespaces[task.namespaceId] ?? {};
    let allowed = permissions['tasks-put-task-_enable'];
    if (task.enabled) {
      allowed = permissions['tasks-put-task-_disable'];
    }

    map[task.id] = allowed;
  }
  return map;
});
const toolbarTitle = computed(
  () => $t(
    'title',
    {
      title: $tc('title', taskList.value.length),
      count: taskList.value.length,
    },
  ).toString(),
);

const storeMenuRef = (task: TaskItem, el: VMenuInstance | null) => {
  if (!el) {
    taskMenusMap.value[task.id] = undefined;
    return;
  }
  taskMenusMap.value[task.id] = el;
};
const fetchNamespaces = async () => {
  loading.value = true;
  try {
    const namespaces = await ezr.fetchNamespaces();
    namespaceMap.value = Object.fromEntries(
      namespaces.map((namespace) => [namespace.id, namespace]),
    );
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const fetch = async () => {
  if (!perms.value.readAll) {
    taskList.value = [];
    return;
  }

  const {
    page = 1,
    itemsPerPage = 12,
    sortBy = ['createdAt'],
  } = iteratorOptions.value ?? {};

  loading.value = true;
  try {
    const { content, meta } = await sdk.tasks.getAllTasks(
      {
        count: itemsPerPage !== -1 ? itemsPerPage : 0,
        previous: pageEndsIds.value[page - 1],
        sort: sortBy[0],
      },
    );
    if (!content) {
      throw new Error($t('$ezreeport.errors.fetch').toString());
    }

    metaList.value = meta;
    taskList.value = content;
    pageEndsIds.value = {
      ...pageEndsIds.value,
      [page]: meta.lastId,
    };
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const showCreateDialog = () => {
  createTaskDialogShown.value = true;
};
const onTaskCreated = async () => {
  createTaskDialogShown.value = false;
  await fetch();
};
const showUpdateDialog = (task: TaskItem) => {
  focusedTask.value = task;
  updateTaskDialogShown.value = true;
};
const onTaskUpdated = async () => {
  updateTaskDialogShown.value = false;
  focusedTask.value = undefined;
  await fetch();
};
const showReadDialog = (task: TaskItem) => {
  focusedTask.value = task;
  readTaskDialogShown.value = true;
};
const showDeletePopover = (task: TaskItem) => {
  let coords = { x: 0, y: 0 };
  const menu = taskMenusMap.value[task.id];
  if (menu) {
    const rect = menu.$el.getBoundingClientRect();
    coords = {
      x: rect.left,
      y: rect.top,
    };
  }

  focusedTask.value = task;
  deleteTaskPopoverCoords.value = coords;
  deleteTaskPopoverShown.value = true;
};
const showTaskDialog = (task: TaskItem) => {
  if (perms.value.update) {
    showUpdateDialog(task);
    return;
  }
  if (perms.value.readOne) {
    showReadDialog(task);
  }
};
const onTaskDeleted = async () => {
  deleteTaskPopoverShown.value = false;
  focusedTask.value = undefined;
  await fetch();
};
const toggleTask = async (task: TaskItem) => {
  if (!toggleStateMap.value[task.id]) {
    return;
  }

  loading.value = true;
  try {
    const action = task.enabled
      ? sdk.tasks.disableTask
      : sdk.tasks.enableTask;

    await action(task.id);
    await onTaskUpdated();

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const duplicateTask = async (task: TaskItem) => {
  if (!perms.value.update && !perms.value.create) {
    return;
  }

  loading.value = true;
  try {
    const { content: fullTask } = await sdk.tasks.getTask(task.id);
    const { content: created } = await sdk.tasks.createTask({
      name: `${fullTask.name} ${$t('duplicate_suffix')}`,
      extends: fullTask.extends?.id,
      recurrence: fullTask.recurrence,
      targets: fullTask.targets,
      template: fullTask.template,
      enabled: fullTask.enabled,
      namespace: fullTask.namespace.id,
      nextRun: new Date(),
    });

    showUpdateDialog({
      id: created.id,
      name: created.name,
      namespaceId: created.namespace.id,
      recurrence: created.recurrence,
      tags: created.extends?.tags,
      enabled: created.enabled,
      nextRun: created.nextRun,
      lastRun: created.lastRun,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      _count: { targets: created.targets.length },
    });
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

watch(
  () => ezr.auth.value.permissions,
  async () => {
    await Promise.all([
      fetch(),
      fetchNamespaces(),
    ]);
  },
  { immediate: true },
);
</script>

<style>
.task-row {
  cursor: pointer;
}
</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh report list'
  title: 'Periodic report table ({count})'
  targetCount: '{n} recipients'
  duplicate_suffix: '(copied)'
  created: 'Created: {date}'
  never: 'Never'
  dates:
    nextRun: 'Next run: {date}'
    lastRun: 'Last ran: {date}'
  headers:
    date: 'Last edit'
    actions: 'Actions'
fr:
  refresh-tooltip: 'Rafraîchir la liste des rapports'
  title: 'Table des rapports périodiques ({count})'
  targetCount: '{n} destinataire|{n} destinataires'
  duplicate_suffix: '(copie)'
  created: 'Créé le {date}'
  never: 'Jamais'
  dates:
    nextRun: 'Prochaine itération: {date}'
    lastRun: 'Dernière itération: {date}'
  headers:
    date: 'Dernière modification'
    actions: 'Actions'
</i18n>
