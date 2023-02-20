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
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive')"
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
                  <div>{{ $t('headers.institution') }}:</div>
                  <InstitutionSelect
                    v-model="task.institution"
                    :error-message="!task.institution ? $t('errors.empty').toString() : undefined"
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
          :disabled="!valid || !isNameValid || !perms.create"
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
import { addDays } from 'date-fns';
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import type { CustomTaskTemplate } from '~/lib/templates/customTemplates';
import CustomSwitch from '~/components/internal/utils/forms/CustomSwitch';
import { tabs } from './TaskDialogRead.vue';

const minDate = addDays(new Date(), 1);

export default defineComponent({
  components: { CustomSwitch },
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
  data: (vm) => ({
    task: {
      name: '',
      template: { extends: 'basic' } as CustomTaskTemplate,
      targets: [],
      recurrence: vm.$ezReeport.sdk.tasks.Recurrence.DAILY,
      institution: '',
      nextRun: minDate,
      enabled: true,
    },
    currentTab: 0,

    minDate,
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
          (v: string) => v.length > 0 || this.$t('errors.empty'),
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
          valid: this.valid,
        },
        {
          ...templateTab,
          valid: this.isTemplateValid,
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
      const perms = this.$ezReeport.auth.permissions;
      return {
        readOne: perms?.['tasks-get-task'],
        create: perms?.['tasks-post'],
      };
    },
    /**
     * Is task's template valid
     */
    isTemplateValid(): boolean {
      if (!this.task?.template.inserts) {
        return true;
      }
      return this.task.template.inserts.findIndex(({ _: { hasError } }) => hasError) < 0;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.resetInstitution();
    },
    id() {
      this.resetInstitution();
    },
  },
  mounted() {
    this.resetInstitution();
  },
  methods: {
    /**
     * Check if given string is a mail address
     *
     * ! ULTRA Simple email validation
     *
     * @param s The string
     */
    validateMail: (s: string) => /[a-z0-9.-]*@[a-z0-9.-]*\.[a-z-]*/i.test(s),
    /**
     * Reset institution value
     */
    resetInstitution() {
      this.task.institution = this.$ezReeport.auth.user?.institution ?? '';
    },
    /**
     * Save and edit task
     */
    async save() {
      if (!this.task || !this.valid || !this.isNameValid) {
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

        const { institution, ...task } = this.task;
        const { content } = await this.$ezReeport.sdk.tasks.createTask(
          {
            name: task.name,
            template: {
              ...this.task.template,
              inserts,
            },
            targets: task.targets,
            recurrence: task.recurrence,
            nextRun: task.nextRun,
            enabled: task.enabled,
          },
          institution,
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
    institution: 'Institution'
    targets: 'Receivers'
    dates: 'Dates'
  tabs:
    details: 'Details'
    template: 'Template'
  task:
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
  errors:
    empty: 'This field must be set'
    format: "One or more address aren't valid"
  actions:
    cancel: 'Cancel'
    save: 'Save'
fr:
  headers:
    name: 'Nom du rapport'
    institution: 'Institution'
    targets: 'Destinataires'
    dates: 'Dates'
  tabs:
    details: 'Détails'
    template: 'Modèle'
  task:
    lastRun: 'Dernière itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
  errors:
    empty: 'Ce champ doit être rempli'
    format: 'Une ou plusieurs addresses ne sont pas valides'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
