<template>
  <v-dialog :fullscreen="tabs[currentTab]?.fullScreen" :value="value" max-width="1000" scrollable @input="$emit('input', $event)">
    <TaskDialogGeneration
      v-if="task && perms.runTask"
      v-model="generationDialogShown"
      :task="task"
      @generated="fetch()"
    />

    <v-card :loading="loading" :tile="tabs[currentTab]?.fullScreen">
      <v-card-title>
        <v-text-field
          v-if="task"
          v-model="task.name"
          :rules="rules.name"
          :label="$t('headers.name')"
        />
        <RecurrenceChip
          v-if="task"
          v-model="task.recurrence"
          selectable
          size="small"
          classes="text-body-2 ml-2"
        />

        <v-spacer />

        <CustomSwitch
          v-if="task"
          v-model="task.enabled"
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive').toString()"
          :disabled="loading"
          class="text-body-2"
          reverse
        />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
        <v-tab v-for="tab in tabs" :key="tab.name">
          {{ $t(`tabs.${tab.name}`) }}
          <v-icon v-if="tab.fullScreen" small class="ml-1">mdi-arrow-expand</v-icon>

          <v-tooltip
            top
            v-if="tab.valid !== true"
            color="warning"
          >
            <template #activator="{ attrs, on }">
              <v-icon
                color="warning"
                small
                class="ml-1"
                v-bind="attrs"
                v-on="on"
              >
                mdi-alert
              </v-icon>
            </template>

            <span>{{ tab.valid }}</span>
          </v-tooltip>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text style="position: relative">
        <v-tabs-items v-model="currentTab" class="mt-2">
          <v-tab-item>
            <!-- Details -->
            <v-form v-if="task" v-model="valid">
              <v-row>
                <v-col>
                  <v-combobox
                    v-model="task.targets"
                    :label="$t('headers.targets')"
                    :rules="rules.targets"
                    multiple
                  >
                    <template #append>
                      <div />
                    </template>

                    <template v-slot:selection="data">
                      <v-chip
                        :key="data.item"
                        :input-value="data.selected"
                        :disabled="data.disabled"
                        :color="!validateMail(data.item) ? 'error' : undefined"
                        small
                        close
                        @click:close="data.parent.selectItem(data.item)"
                        v-bind="data.attrs"
                      >
                        {{ data.item }}
                      </v-chip>
                    </template>
                  </v-combobox>
                </v-col>

                <v-col>
                  <div>{{ $ezReeport.tcNamespace(true) }}:</div>
                  <NamespaceRichListItem :namespace="task.namespace" />

                  <div>{{ $t('headers.dates') }}:</div>
                  <v-container>
                    <v-text-field
                      :value="dates.lastRun"
                      :label="$t('task.lastRun')"
                      prepend-icon="mdi-calendar-arrow-left"
                      disabled
                    />
                    <DatePicker
                      v-model="task.nextRun"
                      :label="$t('task.nextRun').toString()"
                      :min="minDate"
                      icon="mdi-calendar-arrow-right"
                    />
                  </v-container>
                </v-col>
              </v-row>
            </v-form>

          </v-tab-item>

          <v-tab-item>
            <InternalHistoryTable v-if="task" :history="task.history" hide-task hide-namespace />
          </v-tab-item>

          <v-tab-item>
            <TemplateForm v-if="task" />
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn v-if="perms.runTask" color="warning" @click="showGenerateDialog">
          {{ $t('actions.generate') }}
        </v-btn>

        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          :disabled="!task
            || !valid
            || !isNameValid
            || templateValidation !== true"
          :loading="loading"
          color="success"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { addDays, formatISO, parseISO } from 'date-fns';
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent } from 'vue';
import isEmail from 'validator/lib/isEmail';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isTaskTemplate, mapRulesToVuetify } from '~/stores/template';
import { tabs, type Tab } from './TaskDialogRead.vue';

type CustomTask = Omit<tasks.FullTask, 'template'>;

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
    input: (show: boolean) => show !== undefined,
    updated: (task: tasks.FullTask) => !!task,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    generationDialogShown: false,

    task: undefined as CustomTask | undefined,
    currentTab: 0,

    minDate: addDays(new Date(), 1),
    valid: false,

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        name: [
          (v: string) => !!v || this.$t('errors.empty'),
        ],
        targets: [
          (v: string[]) => v.length > 0 || this.$t('errors.empty'),
          (v: string[]) => v.every(this.validateMail) || this.$t('errors.format'),
        ],
        template: mapRulesToVuetify(this.templateStore.rules.template, (k) => this.$t(k)),
      };
    },
    /**
     * Tabs data
     */
    tabs(): (Tab & { valid: true | string })[] {
      const data: (Tab & { valid?: true | string })[] = [...tabs];

      // Add validation data
      const { 0: detailTab, 2: templateTab } = data;
      data[0] = { ...detailTab, valid: this.valid || this.$t('errors._default').toString() };
      data[2] = { ...templateTab, valid: this.templateValidation };

      return data.map((tab) => ({ ...tab, valid: tab.valid ?? true }));
    },
    /**
     * name field is outside of the v-form, so we need to manually check using rules
     */
    isNameValid() {
      return this.rules.name.every((rule) => rule(this.task?.name ?? '') === true);
    },
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      const namespaces = this.task ? [this.task.namespace.id] : [];
      return {
        readOne: has('tasks-get-task', namespaces),
        update: has('tasks-put-task', namespaces),

        runTask: has('tasks-post-task-run', namespaces),
      };
    },
    /**
     * Various dates to show
     */
    dates(): { nextRun?: string, lastRun?: string } {
      return {
        lastRun: this.task?.lastRun?.toLocaleString(),
      };
    },
    /**
     * Is task's template valid
     */
    templateValidation(): true | string {
      const valid = this.templateStore.isCurrentValid;
      if (!this.task || valid === true) {
        return true;
      }

      let err = this.$t(valid.i18nKey);
      if (valid.figure !== undefined) {
        err = this.$t('errors.figures._detail', { valid: err, at: valid.figure });
      }
      if (valid.layout !== undefined) {
        err = this.$t('errors.layouts._detail', { valid: err, at: valid.layout });
      }
      return err.toString();
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
      } else {
        this.templateStore.SET_CURRENT(undefined);
      }
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Check if given string is a mail address
     *
     * @param email The string
     */
    validateMail: (email: string) => isEmail(email),
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
        const { template, ...data } = content;
        this.templateStore.SET_CURRENT(template);

        this.task = data;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Save and edit task
     */
    async save() {
      if (!this.task || !this.valid || !this.isNameValid || this.templateValidation !== true) {
        return;
      }

      if (!this.id || !this.perms.update) {
        this.$emit('input', false);
        return;
      }

      const template = this.templateStore.GET_CURRENT();
      if (!template || !isTaskTemplate(template)) {
        return;
      }

      this.loading = true;
      try {
        const nextRun = formatISO(this.task.nextRun, { representation: 'date' });

        const { content } = await this.$ezReeport.sdk.tasks.upsertTask(
          this.task.id,
          {
            name: this.task.name,
            template,
            targets: this.task.targets,
            recurrence: this.task.recurrence,
            nextRun: parseISO(`${nextRun}T00:00:00.000Z`),
            enabled: this.task.enabled,
          },
        );

        this.$emit('updated', content);
        this.$emit('input', false);
        this.error = '';
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

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    name: 'Report name'
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
  errors:
    _default: 'An error is in this form'
    format: "One or more address aren't valid"
    no_data: 'An error occurred when fetching data'
    empty: 'This field must be set'
    layouts:
      _detail: 'Page {at}: {valid}'
      mixed: 'All figures must be placed the same way (auto or manually)'
      length: 'All pages must contains at least one figure'
    figures:
      _detail: 'Figure {at}: {valid}'
      slots: 'This combinaison of slots is not possible'
  actions:
    generate: 'Generate'
    cancel: 'Cancel'
    save: 'Save'
fr:
  headers:
    name: 'Nom du rapport'
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
  errors:
    _default: 'Une erreur est présente dans ce formulaire'
    format: 'Une ou plusieurs addresses ne sont pas valides'
    no_data: 'Une erreur est survenue lors de la récupération des données'
    empty: 'Ce champ doit être rempli'
    layouts:
      _detail: 'Page {page}: {valid}'
      mixed: 'Toutes les visualisations doivent être placée de la même façon (auto ou manuellement)'
      length: 'Chaque page doit contenir au moins une visualisation'
    figures:
      _detail: 'Visualisation {at}: {valid}'
      slots: "Cette combinaison d'emplacement n'est pas possible"
  actions:
    generate: 'Générer'
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
