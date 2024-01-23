<template>
  <v-col v-if="perms.readAll">
    <TemplateProvider>
      <TaskDialogCreateManager
        v-if="perms.create"
        v-model="createTaskDialogShown"
        :namespace="currentNamespace"
        @created="onTaskCreated"
      />
      <TaskDialogUpdateManager
        v-if="perms.update && focusedTask"
        v-model="updateTaskDialogShown"
        :task-id="focusedTask.id"
        :namespace="currentNamespace"
        @updated="onTaskUpdated"
      />
      <TaskDialogReadManager
        v-if="perms.readOne && focusedTask"
        v-model="readTaskDialogShown"
        :task-id="focusedTask.id"
        :namespace="currentNamespace"
      />
    </TemplateProvider>
    <TaskDialogGenerationManager
      v-if="perms.runTask && focusedTask"
      v-model="generationDialogShown"
      :task-id="focusedTask.id"
      @generated="fetch()"
    />
    <TaskPopoverDelete
      v-if="perms.delete && focusedTask"
      v-model="deleteTaskPopoverShown"
      :coords="deleteTaskPopoverCoords"
      :task="focusedTask"
      @deleted="onTaskDeleted"
    />

    <v-row v-if="!props.hideNamespaceSelector">
      <v-col>
        <NamespaceSelect
          :value="currentNamespace || ''"
          :allowed-namespaces="allowedNamespaces"
          show-task-count
          @input="onNamespaceChanged"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-data-iterator
          :items="taskList"
          :items-per-page="12"
          :footer-props="{
            itemsPerPageOptions: [4, 8, 12, -1],
          }"
          :server-items-length="metaList?.total || 0"
          :options.sync="iteratorOptions"
          item-key="id"
          @update:options="fetch()"
        >
          <template #header>
            <LoadingToolbar
              :text="toolbarTitle"
              :loading="loading"
            >
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

          <template #no-data>
            <div style="position: relative; min-height: 300px;">
              <v-overlay v-if="!error" absolute>
                {{ $t('$vuetify.noDataText') }}
              </v-overlay>

              <ErrorOverlay v-model="error" hide-action />
            </div>
          </template>

          <template #default="{ items }">
            <v-row>
              <v-col
                v-for="task in items"
                :key="task.id"
                cols="3"
              >
                <v-card class="d-flex flex-column" style="height: 100%;">
                  <v-card-title style="word-break: keep-all;">
                    {{ task.name }}
                  </v-card-title>

                  <v-card-subtitle class="d-flex">
                    <MiniTagsDetail :model-value="task.tags" />

                    <v-spacer />

                    <RecurrenceChip
                      :value="task.recurrence"
                      size="small"
                      classes="ml-2"
                    />
                  </v-card-subtitle>

                  <div style="flex: 1;" />

                  <v-card-text>
                    <v-list two-lines class="pa-0">
                      <v-list-item v-if="task.namespaceId !== currentNamespace">
                        <v-list-item-icon style="align-self: auto;">
                          <v-icon>
                            {{ ezr.namespaces.value.icon }}
                          </v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                          <v-list-item-title>
                            <NamespaceRichListItem
                              v-if="namespaceMap[task.namespaceId]"
                              :namespace="namespaceMap[task.namespaceId]"
                              class="pa-0"
                            />
                            <v-progress-circular v-else indeterminate class="my-2" />
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ ezr.tcNamespace(true, 1) }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-icon>
                          <v-icon>
                            {{ task._count.targets ? 'mdi-email-multiple' : 'mdi-email' }}
                          </v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                          <v-list-item-title>
                            {{ $tc('targetCount', task._count.targets) }}
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ $t('$ezreeport.tasks.targets') }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>

                    </v-list>
                  </v-card-text>

                  <v-card-actions>

                    <v-tooltip :disabled="!task.enabled && !task.lastRun" top>
                      <template #activator="{ on, attrs }">
                        <div v-bind="attrs" v-on="on">
                          <CustomSwitch
                            :value="task.enabled"
                            :disabled="!toggleStateMap[task.id]"
                            :readonly="loading"
                            :label="$t(`$ezreeport.tasks.enabled.${task.enabled}`).toString()"
                            hide-details
                            dense
                            reverse
                            class="ml-2"
                            @click.stop="toggleTask(task)"
                          />
                        </div>
                      </template>

                      <div>
                        <DateFormatDiv v-if="task.enabled" :value="task.nextRun" format="dd/MM/yyyy HH:mm">
                          <template #default="{ date }">
                            {{ $t('dates.nextRun', { date }) }}
                          </template>
                        </DateFormatDiv>
                        <DateFormatDiv v-if="task.lastRun" :value="task.lastRun" format="dd/MM/yyyy HH:mm">
                          <template #default="{ date }">
                            {{ $t('dates.lastRun', { date }) }}
                          </template>
                        </DateFormatDiv>
                      </div>
                    </v-tooltip>

                    <v-spacer />

                    <v-menu>
                      <template #activator="{ on, attrs }">
                        <v-btn
                          :ref="(el) => storeMenuRef(task, el)"
                          icon
                          v-bind="attrs"
                          v-on="on"
                        >
                          <v-icon>mdi-cog</v-icon>
                        </v-btn>
                      </template>

                      <v-list>
                        <v-list-item
                          v-if="perms.runTask"
                          @click="showRunDialog(task)"
                        >
                          <v-list-item-action>
                            <v-icon color="warning">mdi-file-document-refresh-outline</v-icon>
                          </v-list-item-action>

                          <v-list-item-title>
                            {{ $t('$ezreeport.generate') }}
                          </v-list-item-title>
                        </v-list-item>

                        <v-divider />

                        <v-list-item
                          v-if="perms.readOne && perms.create"
                          @click="duplicateTask(task)"
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
                          @click="showReadDialog(task)"
                        >
                          <v-list-item-action>
                            <v-icon>mdi-eye</v-icon>
                          </v-list-item-action>

                          <v-list-item-title>
                            {{ $t('$ezreeport.details') }}
                          </v-list-item-title>
                        </v-list-item>

                        <v-list-item v-if="perms.update" @click="showUpdateDialog(task)">
                          <v-list-item-action>
                            <v-icon color="primary">mdi-pencil</v-icon>
                          </v-list-item-action>

                          <v-list-item-title>
                            {{ $t('$ezreeport.edit') }}
                          </v-list-item-title>
                        </v-list-item>

                        <v-list-item v-if="perms.delete" @click="showDeletePopover(task)">
                          <v-list-item-action>
                            <v-icon color="error">mdi-delete</v-icon>
                          </v-list-item-action>

                          <v-list-item-title>
                            {{ $t('$ezreeport.delete') }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-data-iterator>
      </v-col>
    </v-row>
  </v-col>
</template>

<script setup lang="ts">
import type { namespaces, tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { computed, watch, ref } from 'vue';
import type { DataOptions } from 'vuetify';
import type { VMenu } from 'vuetify/lib/components';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

type VMenuInstance = InstanceType<typeof VMenu>;
type TaskItem = tasks.TaskList[number];

const props = defineProps<{
  namespace?: string;
  allowedNamespaces?: string[];
  hideNamespaceSelector?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:namespace', id: string | undefined): void;
}>();

const { $t, $tc } = useI18n();
const { sdk, ...ezr } = useEzR();

const readTaskDialogShown = ref(false);
const updateTaskDialogShown = ref(false);
const createTaskDialogShown = ref(false);
const generationDialogShown = ref(false);
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
const innerNamespace = ref('');
const namespaceMap = ref<Record<string, namespaces.Namespace>>({});
const taskMenusMap = ref<Record<string, VMenuInstance | undefined>>({});
const focusedTask = ref<tasks.TaskList[number] | undefined>(undefined);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;
  const namespaces = props.namespace ? [props.namespace] : (props.allowedNamespaces || []);

  return {
    readAll: has('tasks-get', namespaces),
    readOne: has('tasks-get-task', namespaces),
    update: has('tasks-put-task', namespaces),
    create: has('tasks-post', namespaces),
    delete: has('tasks-delete-task', namespaces),

    runTask: has('tasks-post-task-_run', namespaces),
  };
});
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
const currentNamespace = computed({
  get() {
    return props.namespace || innerNamespace.value;
  },
  set(id) {
    innerNamespace.value = id;
    emit('update:namespace', id || undefined);
  },
});

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
  } = iteratorOptions.value ?? {};

  loading.value = true;
  try {
    const { content, meta } = await sdk.tasks.getAllTasks(
      {
        count: itemsPerPage !== -1 ? itemsPerPage : 0,
        previous: pageEndsIds.value[page - 1],
      },
      currentNamespace.value ? [currentNamespace.value] : undefined,
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
const onNamespaceChanged = async (id: string) => {
  await fetch();
  currentNamespace.value = id;
};
const showRunDialog = (task: TaskItem) => {
  focusedTask.value = task;
  generationDialogShown.value = true;
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
      namespace: currentNamespace.value || fullTask.namespace.id,
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

<i18n lang="yaml">
en:
  title: 'Periodic report list'
  targetCount: '{n} recipients'
  duplicate_suffix: '(copied)'
  dates:
    nextRun: 'Next run: {date}'
    lastRun: 'Last ran: {date}'
  headers:
    actions: 'Actions'
fr:
  title: 'Liste des rapports périodiques'
  targetCount: '{n} destinataire|{n} destinataires'
  duplicate_suffix: '(copie)'
  dates:
    nextRun: 'Prochaine itération: {date}'
    lastRun: 'Dernière itération: {date}'
  headers:
    actions: 'Actions'
</i18n>
