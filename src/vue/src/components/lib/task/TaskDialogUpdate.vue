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

      <v-tabs v-model="currentTab" style="flex-grow: 0;">
        <v-tab v-for="tab in tabs" :key="tab.name">
          {{ tab.label }}
          <v-icon v-if="!tab.valid" color="warning" small right>mdi-alert</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text style="position: relative">
        <v-tabs-items v-model="currentTab" class="mt-2">
          <v-tab-item>
            <!-- Details -->
            <v-form v-if="task" v-model="valid" @input="isDetailValid = $event">
              <v-row>
                <v-col>
                  <v-combobox
                    v-model="task.targets"
                    :label="$t('headers.targets')"
                    :rules="rules.targets"
                    class="mt-1"
                    multiple
                    outlined
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
                  <InstitutionSelect v-model="task.institution" hide-all />

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
          :disabled="!task || !valid || !isNameValid || !isTemplateValid || !perms.update"
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
import CustomSwitch from '~/components/common/CustomSwitch';
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
    input: (show: boolean) => show !== undefined,
    updated: (task: tasks.FullTask) => !!task,
  },
  data: () => ({
    task: undefined as CustomTask | undefined,
    currentTab: 0,

    minDate: addDays(new Date(), 1),
    valid: false,
    isDetailValid: false,

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
      return [
        {
          name: 'details',
          label: this.$t('tabs.details'),
          valid: this.isDetailValid,
        },
        {
          name: 'template',
          label: this.$t('tabs.template'),
          valid: this.isTemplateValid,
        },
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
        update: perms?.['tasks-put-task'],
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
      this.fetch();
    },
    id() {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
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
     * Save and edit task
     */
    async save() {
      if (!this.task || !this.valid || !this.isNameValid || !this.isTemplateValid) {
        return;
      }

      if (!this.id || !this.perms.update) {
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

        const { content } = await this.$ezReeport.sdk.tasks.updateTask(
          this.task.id,
          {
            name: this.task.name,
            institution: this.task.institution,
            template: {
              ...this.task.template,
              inserts,
            },
            targets: this.task.targets,
            recurrence: this.task.recurrence,
            nextRun: this.task.nextRun,
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
    lastRun: 'Last run'
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
    nextRun: 'Prochaine itération'
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
