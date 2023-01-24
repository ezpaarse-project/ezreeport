<template>
  <v-col v-if="perms.readAll">
    <TaskDialog
      v-if="shownTaskDialog"
      :id="focusedTask"
      :show.sync="shownTaskDialog"
      :initial-mode="taskDialogMode"
      @created="onTaskCreated"
      @edited="onTaskEdited"
      @deleted="onTaskDeleted"
    />

    <v-row>
      <InstitutionSelect
        v-model="currentInstitution"
        @input="fetch()"
      />
    </v-row>

    <v-row>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :options.sync="options"
        :server-items-length="totalItems"
        class="data-table"
        item-key="id"
        @click:row="showTaskDialog"
        @update:options="onPaginationChange"
      >
        <template #top>
          <LoadingToolbar :text="$t('title').toString()">
            <RefreshButton
              :loading="loading"
              :tooltip="$t('refresh-tooltip').toString()"
              @click="fetch"
            />

            <v-btn icon color="success" @click="showCreateDialog">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </LoadingToolbar>
        </template>

        <template #[`item.institution`]="{ value: institution }">
          <InstitutionRichListItem
            v-if="institution"
            :institution="institution"
          />
          <span v-else>...</span>
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
            :input-value="enabled"
            :readonly="!perms.enable || !perms.disable"
            :label="$t(enabled ? 'item.active' : 'item.inactive')"
            :disabled="loading"
            reverse
            @click.stop="toggleTask(item)"
          />
        </template>

        <template
          v-if="error"
          #[`body.append`]
        >
          <ErrorOverlay v-model="error" />
        </template>
      </v-data-table>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { institutions, tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import CustomSwitch from '@/common/CustomSwitch';
import type { DataOptions } from 'vuetify';
import type { DataTableHeader } from '../types/vuetify';

interface TaskItem {
  id: string,
  name: string,
  institution?: institutions.Institution,
  recurrence: tasks.Recurrence,
  enabled: boolean,
  nextRun?: string,
}

export default defineComponent({
  components: { CustomSwitch },
  data: () => ({
    currentInstitution: '',
    tasks: [] as tasks.Task[],
    lastIds: {} as Record<number, string | undefined>,
    options: {
      sortBy: ['institution', 'enabled', 'nextRun'],
      sortDesc: [false, true, false],
      multiSort: true,
    } as DataOptions,
    totalItems: 0,
    shownTaskDialog: false,
    taskDialogMode: 'view',
    focusedTask: '' as string,
    loading: false,
    error: '',
  }),
  computed: {
    headers(): DataTableHeader<TaskItem>[] {
      return [
        {
          value: 'name',
          text: this.$t('header.name').toString(),
        },
        {
          value: 'institution',
          text: this.$t('header.institution').toString(),
          sort: (a?: institutions.Institution, b?: institutions.Institution) => (a?.name ?? '').localeCompare(b?.name ?? ''),
        },
        {
          value: 'recurrence',
          text: this.$t('header.recurrence').toString(),
        },
        {
          value: 'enabled',
          text: this.$t('header.status').toString(),
        },
        {
          value: 'nextRun',
          text: this.$t('header.next').toString(),
        },
      ];
    },
    institutions(): institutions.Institution[] {
      return this.$ezReeport.institutions.data;
    },
    items() {
      return this.tasks.map(this.parseTask);
    },
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readAll: perms?.['tasks-get'],

        enable: perms?.['tasks-put-task-enable'],
        disable: perms?.['tasks-put-task-disable'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
      this.fetchInstitutions();
    },
  },
  mounted() {
    this.fetch();
    this.fetchInstitutions();
  },
  methods: {
    /**
     * Fetch institutions
     */
    async fetchInstitutions() {
      this.loading = true;
      try {
        this.$ezReeport.institutions.fetch();
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Called when datatable options are updated
     *
     * @param opts Datatable options
     */
    onPaginationChange(opts: DataOptions) {
      this.fetch(opts.page);
    },
    /**
     * Fetch tasks and parse result
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
            this.currentInstitution || undefined,
          );
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
        institution: this.institutions.find(({ id }) => task.institution === id),
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
    showTaskDialog({ id }: TaskItem) {
      this.taskDialogMode = 'view';
      this.focusedTask = id;
      this.shownTaskDialog = true;
    },
    /**
     * Prepare and show task creation dialog
     */
    showCreateDialog() {
      this.taskDialogMode = 'create';
      this.focusedTask = '';
      this.shownTaskDialog = true;
    },
    /**
     * Toggle task state
     *
     * @param item The item
     */
    async toggleTask({ id, enabled }: tasks.Task) {
      if (
        this.tasks.findIndex((t) => t.id === id) < 0
        || (enabled && !this.perms.disable)
        || (!enabled && !this.perms.enable)
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
      tasks.splice(index, 1, task);
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
  refresh-tooltip: 'Refresh report list'
  header:
    name: 'Report name'
    institution: 'Institution'
    recurrence: 'Recurrence'
    status: 'Status'
    next: 'Next run'
    actions: 'Actions'
  item:
    active: 'Active'
    inactive: 'Inactive'
fr:
  title: 'Liste des rapports périodiques'
  refresh-tooltip: 'Rafraîchir la liste des rapports'
  header:
    name: 'Nom du rapport'
    institution: 'Établissement'
    recurrence: 'Fréquence'
    status: 'Statut'
    next: 'Prochaine itération'
    actions: 'Actions'
  item:
    active: 'Actif'
    inactive: 'Inactif'
</i18n>
