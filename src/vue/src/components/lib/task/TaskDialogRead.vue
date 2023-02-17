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
          :input-value="task.enabled"
          :readonly="!perms.enable || !perms.disable"
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive')"
          :disabled="loading"
          class="text-body-2"
          reverse
          @click.stop="toggle()"
        />

        <RefreshButton
          :loading="loading"
          :tooltip="$t('refresh-tooltip').toString()"
          @click="fetch"
        />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;">
        <v-tab v-for="tab in tabs" :key="tab.name">
          {{ tab.label }}
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
                {{ $t('headers.institution') }}:
                <InstitutionRichListItem
                  v-if="institution"
                  :institution="institution"
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
            <InternalHistoryTable v-if="task" :history="task.history" hide-task hide-institution />
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn :disabled="!perms.runTask" color="warning" @click="showGenerateDialog">
          {{ $t('actions.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { institutions, tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import CustomSwitch from '@/common/CustomSwitch';

import { addAdditionalDataToLayouts, type CustomTaskTemplate } from '../template/customTemplates';

type CustomTask = Omit<tasks.FullTask, 'template'> & { template: CustomTaskTemplate };

export default defineComponent({
  components: { CustomSwitch },
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
    currentTab: 0,

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * Validation rules
     */
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readOne: perms?.['tasks-get-task'],
        update: perms?.['tasks-put-task'],

        enable: perms?.['tasks-put-task-enable'],
        disable: perms?.['tasks-put-task-disable'],

        runTask: perms?.['tasks-post-task-run'],
      };
    },
    /**
     * User permissions
     */
    institution(): institutions.Institution | undefined {
      return this.$ezReeport.institutions.data.find(({ id }) => id === this.task?.institution);
    },
    /**
     * Tabs data
     */
    tabs() {
      return [
        {
          name: 'details',
          label: this.$t('tabs.details'),
        },
        {
          name: 'template',
          label: this.$t('tabs.template'),
        },
        {
          name: 'history',
          label: this.$t('tabs.history'),
        },
      ];
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
    '$ezReeport.auth.permissions': function () {
      this.fetch();
      this.fetchInstitutions();
    },
    id() {
      this.fetch();
    },
  },
  mounted() {
    this.fetchInstitutions();
    this.fetch();
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
fr:
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
  </i18n>
