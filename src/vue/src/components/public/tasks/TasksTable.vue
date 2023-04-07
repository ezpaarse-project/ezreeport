<template>
  <v-col v-if="perms.readAll">
    <TaskDialogCreate
      v-if="perms.create"
      v-model="createTaskDialogShown"
      :id="focusedId"
      @created="onTaskCreated"
    />
    <TaskDialogRead
      v-if="perms.readOne"
      v-model="readTaskDialogShown"
      :id="focusedId"
      @updated="onTaskEdited"
    />
    <TaskDialogUpdate
      v-if="perms.update"
      v-model="updateTaskDialogShown"
      :id="focusedId"
      @updated="onTaskEdited"
    />
    <TaskPopoverDelete
      v-if="perms.delete && focusedTask"
      v-model="deleteTaskPopoverShown"
      :task="focusedTask"
      :coords="deleteTaskPopoverCoords"
      @deleted="onTaskDeleted"
    />

    <v-row>
      <v-col>
        <NamespaceSelect
          v-model="currentNamespace"
          hide-refresh
          @input="fetch()"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          :options.sync="options"
          :server-items-length="totalItems"
          :items-per-page-options="[5, 10, 15]"
          class="data-table"
          item-key="id"
          @click:row="showTaskDialog"
          @update:options="onPaginationChange"
        >
          <template #top>
            <LoadingToolbar :text="$t('title').toString()">
              <v-tooltip top v-if="perms.create">
                <template #activator="{ on, attrs }">
                  <v-btn icon color="success" @click="showCreateDialog" v-bind="attrs" v-on="on">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </template>

                {{$t('actions.create')}}
              </v-tooltip>
            </LoadingToolbar>
          </template>

          <template #[`item.namespace`]="{ value: namespace }">
            <NamespaceRichListItem
              v-if="namespace"
              :namespace="namespace"
            />
            <v-progress-circular v-else indeterminate class="my-2" />
          </template>

          <template #[`item.recurrence`]="{ value: recurrence }">
            <div class="text-center">
              <RecurrenceChip
                :value="recurrence"
              />
            </div>
          </template>

          <template #[`item.enabled`]="{ value: enabled, item }">
            <CustomSwitch
              :value="enabled"
              :readonly="loading"
              :disabled="!rawNamespacePerms?.[item.namespace?.id ?? '']?.['tasks-put-task-enable']
                || !rawNamespacePerms?.[item.namespace?.id ?? '']?.['tasks-put-task-disable']
              "
              :label="$t(enabled ? 'item.active' : 'item.inactive').toString()"
              reverse
              @click.stop="toggleTask(item)"
            />
          </template>

          <template #[`item.actions`]="{ item }">
            <v-tooltip top v-if="rawNamespacePerms?.[item.namespace?.id ?? '']?.['tasks-put-task']">
              <template #activator="{ attrs, on }">
                <v-btn icon color="info" @click.stop="showEditDialog(item)" v-on="on" v-bind="attrs">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('actions.edit') }}</span>
            </v-tooltip>

            <v-tooltip top v-if="rawNamespacePerms?.[item.namespace?.id ?? '']?.['tasks-delete-task']">
              <template #activator="{ attrs, on }">
                <v-btn icon color="error" @click.stop="showDeletePopover(item, $event)" v-on="on" v-bind="attrs">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('actions.delete') }}</span>
            </v-tooltip>
          </template>

          <template v-if="error" #[`body.append`]>
            <ErrorOverlay v-model="error" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { namespaces, tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import type { DataOptions } from 'vuetify';
import type { DataTableHeader } from '~/types/vuetify';
import ezReeportMixin from '~/mixins/ezr';

interface TaskItem {
  id: string,
  name: string,
  namespace?: namespaces.Namespace,
  recurrence: tasks.Recurrence,
  enabled: boolean,
  nextRun?: string,
}

export default defineComponent({
  mixins: [ezReeportMixin],
  data: () => ({
    readTaskDialogShown: false,
    createTaskDialogShown: false,
    updateTaskDialogShown: false,
    deleteTaskPopoverShown: false,
    deleteTaskPopoverCoords: { x: 0, y: 0 },

    options: {
      sortBy: ['namespace', 'enabled', 'nextRun'],
      sortDesc: [false, true, false],
      multiSort: true,
    } as DataOptions,
    lastIds: {} as Record<number, string | undefined>,

    currentNamespace: '',
    tasks: [] as tasks.Task[],
    totalItems: 0,
    focusedId: '' as string,

    loading: false,
    error: '',
  }),
  computed: {
    headers(): DataTableHeader<TaskItem>[] {
      return [
        {
          value: 'name',
          text: this.$t('headers.name').toString(),
        },
        {
          value: 'namespace',
          text: this.$ezReeport.tcNamespace(true),
          sort: (a?: namespaces.Namespace, b?: namespaces.Namespace) => (a?.name ?? '').localeCompare(b?.name ?? ''),
        },
        {
          value: 'recurrence',
          text: this.$t('headers.recurrence').toString(),
        },
        {
          value: 'enabled',
          text: this.$t('headers.status').toString(),
        },
        {
          value: 'nextRun',
          text: this.$t('headers.next').toString(),
        },
        {
          value: 'actions' as keyof TaskItem,
          text: this.$t('headers.actions').toString(),
          sortable: false,
        },
      ];
    },
    namespaces(): namespaces.Namespace[] {
      return this.$ezReeport.data.namespaces.data;
    },
    items() {
      return this.tasks.map(this.parseTask);
    },
    rawNamespacePerms() {
      return this.$ezReeport.data.auth.permissions?.namespaces;
    },
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;

      return {
        readAll: has('tasks-get', []),
        readOne: has('tasks-get-task', []),
        update: has('tasks-put-task', []),
        create: has('tasks-post', []),
        delete: has('tasks-delete-task', []),
      };
    },
    focusedTask() {
      return this.tasks.find(({ id }) => id === this.focusedId);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
      this.fetchNamespaces();
    },
  },
  mounted() {
    this.fetch();
    this.fetchNamespaces();
  },
  methods: {
    /**
     * Fetch namespaces
     */
    async fetchNamespaces() {
      this.loading = true;
      try {
        this.$ezReeport.fetchNamespaces();
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Called when data table options are updated
     *
     * @param opts DataTable options
     */
    onPaginationChange(opts: DataOptions) {
      this.fetch(opts.page);
    },
    /**
     * Fetch tasks and parse result
     *
     * @param page The page to fetch, if not present it default to current page
     */
    async fetch(page?:number) {
      if (!page) {
        // eslint-disable-next-line no-param-reassign
        page = this.options.page;
      }

      if (this.perms.readAll) {
        this.loading = true;
        try {
          // TODO: sort (not supported by API)
          const { content, meta } = await this.$ezReeport.sdk.tasks.getAllTasks(
            {
              previous: this.lastIds[page - 1],
              count: this.options.itemsPerPage,
            },
            this.currentNamespace ? [this.currentNamespace] : undefined,
          );
          if (!content) {
            throw new Error(this.$t('errors.no_data').toString());
          }

          this.tasks = content;
          this.totalItems = meta.total;

          const lastIds = { ...this.lastIds };
          lastIds[page] = meta.lastId as string | undefined;
          this.lastIds = lastIds;
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      } else {
        this.tasks = [];
      }
    },
    /**
     *
     * Parse task into human readable format
     *
     * @param task The task
     */
    parseTask(task: tasks.Task): TaskItem {
      return {
        id: task.id,
        name: task.name,
        recurrence: task.recurrence,
        enabled: task.enabled,
        namespace: this.namespaces.find(({ id }) => task.namespaceId === id),
        nextRun: task.nextRun && task.enabled
          ? task.nextRun.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
          : undefined,
      };
    },
    /**
     * Prepare and show task detail dialog
     *
     * @param item The item
     */
    showTaskDialog({ id, namespace }: TaskItem) {
      if (!this.rawNamespacePerms?.[namespace?.id ?? '']?.['tasks-get-task']) {
        return;
      }

      this.focusedId = id;
      this.readTaskDialogShown = true;
    },
    /**
     * Prepare and show task creation dialog
     */
    async showCreateDialog() {
      this.focusedId = '';
      await this.$nextTick();
      this.createTaskDialogShown = true;
    },
    /**
     * Prepare and show task edition dialog
     *
     * @param item The item
     */
    showEditDialog({ id }: TaskItem) {
      this.focusedId = id;
      this.updateTaskDialogShown = true;
    },
    /**
     * Prepare and show task deletion popover
     *
     * @param item The item
     * @param event The base event
     */
    async showDeletePopover({ id }: TaskItem, event: MouseEvent) {
      this.focusedId = id;
      this.deleteTaskPopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.deleteTaskPopoverShown = true;
    },
    /**
     * Toggle task state
     *
     * @param item The item
     */
    async toggleTask({ id, enabled, namespace }: TaskItem) {
      if (
        this.tasks.findIndex((t) => t.id === id) < 0
        || (enabled && !this.rawNamespacePerms?.[namespace?.id ?? '']?.['tasks-put-task-enable'])
        || (!enabled && !this.rawNamespacePerms?.[namespace?.id ?? '']?.['tasks-put-task-disable'])
      ) {
        return;
      }

      this.loading = true;
      try {
        const action = enabled
          ? this.$ezReeport.sdk.tasks.disableTask
          : this.$ezReeport.sdk.tasks.enableTask;

        const { content } = await action(id);

        this.onTaskEdited(content);

        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Called when a task is created by a dialog
     */
    onTaskCreated() {
      // TODO? go to first page ?
      this.fetch();
    },
    /**
     * Called when a task is deleted by a dialog
     */
    onTaskDeleted() {
      this.fetch();
    },
    /**
     * Called when a task is edited by a dialog
     */
    onTaskEdited(task: tasks.FullTask) {
      const index = this.tasks.findIndex((t) => t.id === task.id);
      if (index < 0) {
        return;
      }

      const tasks = [...this.tasks];
      tasks.splice(index, 1, { ...task, namespaceId: task.namespace.id });
      this.tasks = tasks;
    },
  },
});
</script>

<style lang="scss" scoped>
.data-table::v-deep .v-data-table__wrapper {
  position: relative;
  cursor: pointer;
}
</style>

<i18n lang="yaml">
en:
  title: 'Periodic report list'
  headers:
    name: 'Report name'
    recurrence: 'Recurrence'
    status: 'Status'
    next: 'Next run'
    actions: 'Actions'
  item:
    active: 'Active'
    inactive: 'Inactive'
  actions:
    create: 'Create'
    edit: 'Edit'
    delete: 'Delete'
fr:
  title: 'Liste des rapports périodiques'
  headers:
    name: 'Nom du rapport'
    recurrence: 'Fréquence'
    status: 'Statut'
    next: 'Prochaine itération'
    actions: 'Actions'
  item:
    active: 'Actif'
    inactive: 'Inactif'
  actions:
    create: 'Créer'
    edit: 'Éditer'
    delete: 'Supprimer'
</i18n>
