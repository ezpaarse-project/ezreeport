<template>
  <v-dialog
    v-if="perms.readOne"
    :value="show"
    scrollable
    @input="$emit('update:show', $event)"
  >
    <v-card
      :loading="loading"
    >
      <v-card-title>
        <div v-if="task">
          {{ task.name }}
          <RecurrenceChip
            size="small"
            class="text-body-2 ml-2"
            :value="task.recurrence"
          />
        </div>

        <v-spacer />

        <CustomSwitch
          v-if="task"
          :input-value="task.enabled"
          :readonly="!perms.enable || !perms.disable"
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive')"
          class="text-body-2"
          reverse
        />

        <RefreshButton
          v-if="mode === 'view'"
          :loading="loading"
          :tooltip="$t('refresh-tooltip').toString()"
          @click="fetch"
        />
        <v-btn
          icon
          text
          @click="$emit('update:show', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-tabs>
          <v-tab>
            {{ $t('tabs.details') }}
          </v-tab>
          <v-tab>
            {{ $t('tabs.template') }}
          </v-tab>
          <v-tab v-if="mode === 'view'">
            {{ $t('tabs.history') }}
          </v-tab>

          <v-tab-item>
            <TaskDetail v-if="mode === 'view'" :task="task" :loading="loading" />
          </v-tab-item>

          <v-tab-item>
            <TemplateDetail v-if="mode === 'view' && task" :template="task.template" />
          </v-tab-item>

          <v-tab-item v-if="mode === 'view'">
            <InternalHistoryTable
              v-if="task"
              :history="task.history"
              hide-task
              hide-institution
            />
          </v-tab-item>
        </v-tabs>
      </v-card-text>

      <v-divider />

      <v-card-actions v-if="mode === 'view'">
        <v-btn
          text
          color="warning"
        >
          {{ $t('actions.generate') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          text
          color="info"
          @click="mode = 'edit'"
        >
          {{ $t('actions.edit') }}
        </v-btn>

        <v-btn
          v-if="perms.delete"
          text
          color="error"
        >
          {{ $t('actions.delete') }}
        </v-btn>
      </v-card-actions>
      <v-card-actions v-else>
        ...
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import CustomSwitch from '@/common/CustomSwitch';

export default defineComponent({
  components: { CustomSwitch },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    initialMode: {
      type: String as PropType<'view' | 'edit' | 'create'>,
      default: 'view',
    },
    id: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    mode: 'view',
    task: undefined as tasks.FullTask | undefined,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        create: perms?.['crons-get-cron'],
        readOne: perms?.['tasks-get-task'],
        update: perms?.['tasks-put-task'],
        delete: perms?.['tasks-delete-task'],

        enable: perms?.['tasks-put-task-enable'],
        disable: perms?.['tasks-put-task-disable'],

        createFile: perms?.['tasks-post-task-run'],
        readFile: perms?.['reports-get-year-yearMonth-filename'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
    },
    id() {
      this.fetch();
    },
  },
  mounted() {
    this.mode = this.initialMode;
    this.fetch();
  },
  methods: {
    /**
     * Fetch task info
     */
    async fetch() {
      if (this.id && this.perms.readOne) {
        this.loading = true;
        try {
          const { content } = await this.$ezReeport.sdk.tasks.getTask(this.id);
          this.task = content;
          this.error = '';
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      } else {
        this.task = undefined;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh task'
  show-more-tooltip: 'Show {count} more'
  show-less-tooltip: 'Show less'
  headers:
    institution: 'Institution'
    targets: 'Receivers'
    dates: 'Dates'
  tabs:
    details: 'Details'
    template: 'Template'
    history: 'History'
  task:
    lastRun: 'Last run'
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
  actions:
    generate: 'Generate'
    edit: 'Edit'
    delete: 'Delete'
fr:
  refresh-tooltip: 'Rafraichir la tâche'
  show-more-tooltip: 'Afficher plus ({count})'
  show-less-tooltip: 'Afficher moins'
  headers:
    institution: 'Institution'
    targets: 'Destinataires'
    dates: 'Dates'
  tabs:
    details: 'Détails'
    template: 'Modèle'
    history: 'Historique'
  task:
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
  actions:
    generate: 'Générer'
    edit: 'Éditer'
    delete: 'Supprimer'
</i18n>
