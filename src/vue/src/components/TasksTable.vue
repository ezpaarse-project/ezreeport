<template>
  <v-col>
    <TaskDialog
      :id="focusedTask"
      :show.sync="shownTaskDialog"
    />

    <v-row>
      <InstitutionSelect
        v-model="currentInstitution"
        @input="fetch()"
        @fetched="institutions = $event"
      />
    </v-row>

    <v-row>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :sort-by="['institution', 'enabled', 'nextRun']"
        :sort-desc="[false, true, false]"
        class="data-table"
        item-key="id"
        @click:row="showTaskDialog($event)"
      >
        <template #top>
          <LoadingToolbar :text="$t('title').toString()">
            <RefreshButton
              :loading="loading"
              :tooltip="$t('refresh-tooltip').toString()"
              @click="fetch"
            />
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

        <template #[`item.enabled`]="{ value: enabled }">
          <CustomSwitch
            :input-value="enabled"
            :label="$t(enabled ? 'item.active' : 'item.inactive')"
            reverse
            @click.stop=""
          />
        </template>

        <template
          v-if="error"
          #[`body.append`]
        >
          <ErrorOverlay :error="error" />
        </template>
      </v-data-table>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { auth, tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import CustomSwitch from '@/common/CustomSwitch';
import type { DataTableHeader } from '../types/vuetify';

interface TaskItem {
  id: string,
  name: string,
  institution?: auth.Institution,
  recurrence: tasks.Recurrence,
  enabled: boolean,
  nextRun?: string,
}

export default defineComponent({
  components: { CustomSwitch },
  data: () => ({
    institutions: [] as auth.Institution[],
    currentInstitution: '',
    tasks: [] as tasks.Task[],
    shownTaskDialog: false,
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
          sort: (a?: auth.Institution, b?: auth.Institution) => (a?.name ?? '').localeCompare(b?.name ?? ''),
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
    items() {
      return this.tasks.map(this.parseTask);
    },
    perms() {
      const perms = this.$ezReeport.auth_permissions;
      return {
        readAll: perms?.['tasks-get'],
        start: perms?.['tasks-put-task-enable'],
        stop: perms?.['tasks-put-task-disable'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth_permissions': function () {
      if (this.perms.readAll) {
        this.fetch();
      } else {
        this.tasks = [];
      }
    },
  },
  methods: {
    /**
     * Fetch tasks and parse result
     */
    async fetch() {
      this.loading = true;
      try {
        // TODO: pagination
        const { content } = await this.$ezReeport.tasks.getAllTasks(
          undefined,
          this.currentInstitution || undefined,
        );
        this.tasks = content;
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
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
      this.focusedTask = id;
      this.shownTaskDialog = true;
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
messages:
  en:
    title: Task list
    refresh-tooltip: Refresh task list
    header:
      name: Name
      institution: Institution
      recurrence: Recurrence
      status: Status
      next: Next run
      actions: Actions
    item:
      active: Active
      inactive: Inactive
  fr:
    title: Liste des tâches
    refresh-tooltip: Rafraîchir la liste des tâches
    header:
      name: Nom
      institution: Etablissement
      recurrence: Recurrence
      status: Status
      next: Prochaine itération
      actions: Actions
    item:
      active: Actif
      inactive: Inactif
</i18n>
