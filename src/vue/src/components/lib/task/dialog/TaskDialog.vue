<template>
  <v-dialog
    v-if="perms.readOne"
    :value="show"
    width="850"
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
        <KeepAlive>
          <component
            :is="component"
            :task="task"
          />
        </KeepAlive>
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
import CustomSwitch from '../common/CustomSwitch';
import TaskDetailDialog from './TaskDetailDialog.vue';

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
    component() {
      switch (this.mode) {
        case 'edit':
        case 'create':
          return TaskDetailDialog; // TODO

        default:
          return TaskDetailDialog;
      }
    },
    perms() {
      const perms = this.$ezReeport.auth_permissions;
      return {
        create: perms?.['crons-get-cron'],
        readOne: perms?.['tasks-get-task'],
        update: perms?.['tasks-put-task'],
        delete: perms?.['tasks-delete-task'],

        enable: perms?.['tasks-put-task-enable'],
        disable: perms?.['tasks-put-task-disable'],

        readInstitutions: perms?.['auth-get-institutions'],

        createFile: perms?.['tasks-post-task-run'],
        readFile: perms?.['reports-get-year-yearMonth-filename'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth_permissions': function () {
      if (this.perms.readOne) {
        this.fetch();
      } else {
        this.task = undefined;
      }
    },
    id() {
      if (this.perms.readOne) {
        this.fetch();
      } else {
        this.task = undefined;
      }
    },
  },
  mounted() {
    this.mode = this.initialMode;
  },
  methods: {
    /**
     * Fetch task info
     */
    async fetch() {
      if (this.id) {
        this.loading = true;
        try {
          const { content } = await this.$ezReeport.tasks.getTask(this.id);
          this.task = content;
          this.error = '';
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    refresh-tooltip: Refresh task
    item:
      active: Active
      inactive: Inactive
    actions:
      generate: Generate
      edit: Edit
      delete: Delete
  fr:
    refresh-tooltip: Rafraichir la tâche
    actions:
      generate: Générer
      edit: Éditer
      delete: Supprimer
    item:
      active: Actif
      inactive: Inactif
</i18n>
