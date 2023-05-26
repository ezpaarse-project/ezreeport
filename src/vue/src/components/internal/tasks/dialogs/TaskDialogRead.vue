<template>
  <v-dialog :fullscreen="currentTab === 1" :value="value" max-width="1000" scrollable @input="$emit('input', $event)">
    <TaskDialogGeneration
      v-if="task && perms.runTask"
      v-model="generationDialogShown"
      :task="task"
      @generated="fetch()"
    />

    <v-card :loading="loading" :tile="currentTab === 1">
      <v-card-title>
        <template v-if="task">
          {{ task.name }}
          <RecurrenceChip size="small" classes="text-body-2 ml-2" :value="task.recurrence" />
        </template>

        <v-spacer />

        <CustomSwitch
          v-if="task"
          :value="task.enabled"
          :disabled="!perms.enable || !perms.disable"
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive').toString()"
          :readonly="loading"
          class="text-body-2"
          reverse
          @click.stop="toggle()"
        />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
        <v-tab v-for="tab in tabs" :key="tab.name">
          {{ $t(`tabs.${tab.name}`) }}
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text style="position: relative">
        <v-tabs-items v-model="currentTab" class="mt-2">
          <v-tab-item>
            <!-- Details -->
            <v-row>
              <v-col>
                <v-combobox
                  v-if="task"
                  v-model="task.targets"
                  :label="$t('headers.targets') + ':'"
                  multiple
                  disabled
                  class="target-cb"
                >
                  <template #append>
                    <div />
                  </template>

                  <template v-slot:selection="{ item, attrs }">
                    <v-chip
                      :key="item"
                      small
                      outlined
                      v-bind="attrs"
                    >
                      {{ item }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>

              <v-col>
                <span>{{ $ezReeport.tcNamespace(true) }}:</span>
                <NamespaceRichListItem
                  v-if="namespace"
                  :namespace="namespace"
                />
                <v-progress-circular v-else indeterminate class="my-2" />

                {{ $t('headers.dates') }}:
                <v-container>
                  <div v-if="task?.lastRun">
                    <v-icon small>
                      mdi-calendar-arrow-left
                    </v-icon>
                    {{ $t('task.lastRun') }}: {{ dates.lastRun }}
                  </div>
                  <div v-if="task?.nextRun">
                    <v-icon small>
                      mdi-calendar-arrow-right
                    </v-icon>
                    {{ $t('task.nextRun') }}: {{ dates.nextRun }}
                  </div>
                </v-container>
              </v-col>
            </v-row>
          </v-tab-item>

          <v-tab-item>
            <TemplateDetail v-if="task" :template="task.template" />
          </v-tab-item>

          <v-tab-item>
            <InternalHistoryTable v-if="task" :history="task.history" hide-task hide-namespace />
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn v-if="perms.runTask" color="warning" @click="showGenerateDialog">
          {{ $t('actions.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { namespaces, tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent } from 'vue';
import { addAdditionalDataToLayouts, type CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';

type CustomTask = Omit<tasks.FullTask, 'template'> & { template: CustomTaskTemplate };

export const tabs = [
  { name: 'details' },
  { name: 'template' },
  { name: 'activity' },
] as const;

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  emits: {
    updated: (task: tasks.FullTask) => !!task,
    input: (show: boolean) => show !== undefined,
  },
  data: () => ({
    generationDialogShown: false,

    task: undefined as CustomTask | undefined,
    tabs,
    currentTab: 0,

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * Validation rules
     */
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      const namespaces = this.task ? [this.task.namespace.id] : [];
      return {
        readOne: has('tasks-get-task', namespaces),
        update: has('tasks-put-task', namespaces),

        enable: has('tasks-put-task-enable', namespaces),
        disable: has('tasks-put-task-disable', namespaces),

        runTask: has('tasks-post-task-run', namespaces),
      };
    },
    /**
     * User permissions
     */
    namespace(): namespaces.Namespace | undefined {
      return this.$ezReeport.data.namespaces.data.find(({ id }) => id === this.task?.namespace.id);
    },
    /**
     * Max Width of the dialog
     */
    dates(): { nextRun?: string, lastRun?: string } {
      return {
        nextRun: this.task?.enabled ? this.task.nextRun.toLocaleDateString() : undefined,
        lastRun: this.task?.lastRun?.toLocaleString(),
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    value(val: boolean) {
      if (val) {
        this.fetch();
      }
    },
  },
  methods: {
    /**
     * Fetch task info
     */
    async fetch() {
      if (!this.id || !this.perms.readOne) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.tasks.getTask(this.id);
        if (!content) {
          throw new Error(this.$t('errors.no_data').toString());
        }

        // Add additional data
        content.template.inserts = addAdditionalDataToLayouts(content.template.inserts ?? []);

        this.task = content as CustomTask;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Toggle task status
     */
    async toggle() {
      if (
        !this.task
        || (this.task.enabled && !this.perms.disable)
        || (!this.task.enabled && !this.perms.enable)
      ) {
        this.task = undefined;
        return;
      }

      this.loading = true;
      try {
        const action = this.task.enabled
          ? this.$ezReeport.sdk.tasks.disableTask
          : this.$ezReeport.sdk.tasks.enableTask;

        const { content } = await action(this.id);

        // Add additional data
        content.template.inserts = addAdditionalDataToLayouts(content.template.inserts ?? []);

        this.task = content as CustomTask;
        this.error = '';
        this.$emit('updated', content);
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Prepare and show task generation dialog
     */
    showGenerateDialog() {
      if (!this.perms.runTask) {
        return;
      }

      this.generationDialogShown = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.target-cb::v-deep > .v-input__control > .v-input__slot {
  &:before,
  &:after {
    display: none;
  }
}
</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh task'
  headers:
    targets: 'Receivers'
    dates: 'Dates'
  tabs:
    details: 'Details'
    template: 'Template'
    activity: 'Activity'
  task:
    lastRun: 'Last run'
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
  actions:
    generate: 'Generate'
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  refresh-tooltip: 'Rafraîchir la tâche'
  headers:
    targets: 'Destinataires'
    dates: 'Dates'
  tabs:
    details: 'Détails'
    template: 'Modèle'
    activity: 'Activité'
  task:
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
  actions:
    generate: 'Générer'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
