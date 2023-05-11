<template>
  <v-dialog :fullscreen="currentTab === 1" :value="value" max-width="1000" scrollable @input="$emit('input', $event)">
    <v-card :loading="loading" :tile="currentTab === 1">
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

          <v-tooltip top v-if="tab.valid !== true" color="warning">
            <template #activator="{ attrs, on }">
              <v-icon
                color="warning"
                small
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
                  <NamespaceSelect
                    v-model="task.namespace"
                    :error-message="!task.namespace ? $t('errors.empty').toString() : undefined"
                    :needed-permissions="['tasks-post']"
                    hide-all
                  />

                  <div>{{ $t('headers.dates') }}:</div>
                  <v-container>
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
            <TemplateForm
              v-if="task"
              :template.sync="task.template"
            />
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          :disabled="!task
            || !valid
            || !isNameValid
            || templateValidation !== true
            || !perms.create"
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
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import { cloneDeep } from 'lodash';
import isEmail from 'validator/lib/isEmail';
import type { CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';
import { tabs } from './TaskDialogRead.vue';

type CustomCreateTask = Omit<tasks.FullTask, 'createdAt' | 'id' | 'history' | 'namespace' | 'template'> & {
  template: CustomTaskTemplate,
  namespace: string;
};

const minDate = addDays(new Date(), 1);

const initTask = {
  name: '',
  template: { extends: 'scratch' } as CustomTaskTemplate,
  targets: [],
  recurrence: 'DAILY' as tasks.Recurrence,
  namespace: '',
  nextRun: minDate,
  enabled: true,
} as CustomCreateTask;

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    created: (task: tasks.FullTask) => !!task,
  },
  data: () => ({
    task: undefined as CustomCreateTask | undefined,
    currentTab: 0,

    minDate,
    valid: false,

    loading: false,
    error: '',
  }),
  watch: {
    value(val: boolean) {
      if (val) {
        this.task = cloneDeep(initTask);
      }
    },
  },
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
      };
    },
    /**
     * Tabs data
     */
    tabs() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [detailTab, templateTab, historyTab, ...otherTabs] = tabs;
      return [
        {
          ...detailTab,
          valid: this.valid || this.$t('errors._default'),
        },
        {
          ...templateTab,
          valid: this.templateValidation,
        },
        // ...otherTabs.map((v) => ({ ...v, valid: true })),
      ];
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
      const namespaces = this.task?.namespace ? [this.task.namespace] : [];
      return {
        readOne: has('tasks-get-task', namespaces),
        create: has('tasks-post', namespaces),
      };
    },
    /**
     * Is task's template valid
     */
    templateValidation(): true | string {
      if (!this.task || !this.task.template.inserts) {
        return true;
      }

      const invalidInsert = this.task.template.inserts.find(({ _: { valid } }) => valid !== true);
      if (invalidInsert) {
        return this.$t(
          'errors.layouts._detail',
          {
            at: invalidInsert.at,
            valid: invalidInsert._.valid,
          },
        ).toString();
      }

      return true;
    },
  },
  methods: {
    /**
     * Check if given string is a mail address
     *
     * @param email The string
     */
    validateMail: (email: string) => isEmail(email),
    /**
     * Save and edit task
     */
    async save() {
      if (!this.task || !this.valid || !this.isNameValid || this.templateValidation !== true) {
        return;
      }

      if (!this.perms.create) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        // Remove frontend data from payload
        const inserts = this.task.template.inserts?.map(
          ({ _, ...insert }) => ({
            ...insert,
            // eslint-disable-next-line @typescript-eslint/no-shadow
            figures: insert.figures.map(({ _, ...figure }) => figure),
          }),
        );

        const nextRun = formatISO(this.task.nextRun, { representation: 'date' });

        const { content } = await this.$ezReeport.sdk.tasks.createTask(
          {
            name: this.task.name,
            namespace: this.task.namespace,
            template: {
              ...this.task.template,
              inserts,
            },
            targets: this.task.targets,
            recurrence: this.task.recurrence,
            nextRun: parseISO(`${nextRun}T00:00:00.000Z`),
            enabled: this.task.enabled,
          },
        );

        this.$emit('created', content);
        this.$emit('input', false);
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
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
  task:
    lastRun: 'Last run'
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
  errors:
    _default: 'An error is in this form'
    layouts:
      _detail: 'Page {at}: {valid}'
    empty: 'This field must be set'
    format: "One or more address aren't valid"
  actions:
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
  task:
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
  errors:
    _default: 'Une erreur est présente dans ce formulaire'
    layouts:
      _detail: 'Page {at}: {valid}'
    empty: 'Ce champ doit être rempli'
    format: 'Une ou plusieurs addresses ne sont pas valides'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
