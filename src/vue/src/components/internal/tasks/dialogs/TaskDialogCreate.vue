<template>
  <v-dialog
    :value="value"
    :fullscreen="tabs[currentTab].fullScreen"
    :persistent="!valid"
    max-width="1000"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading" :tile="tabs[currentTab].fullScreen">
      <v-card-title>
        <v-text-field
          v-if="task"
          v-model="task.name"
          :rules="rules.name"
          :label="$t('$ezreeport.tasks.name')"
        />
        <RecurrenceChip
          v-if="task"
          v-model="task.recurrence"
          selectable
          size="small"
          classes="text-body-2 mx-2"
        />

        <CustomSwitch
          v-if="task"
          v-model="task.enabled"
          :label="$t(`$ezreeport.tasks.enabled.${task?.enabled}`).toString()"
          :disabled="loading"
          class="text-body-2"
          reverse
        />

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
        <v-tab v-for="tab in tabs" :key="tab.name">
          {{ $t(`$ezreeport.tasks.tabs.${tab.name}`) }}
          <v-icon v-if="tab.fullScreen" class="ml-1">mdi-arrow-expand</v-icon>

          <v-tooltip top v-if="tab.valid !== true" color="warning">
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
                    :label="$t('$ezreeport.tasks.targets')"
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
                    :error-message="!task.namespace ? $t('$ezreeport.tasks.errors.empty').toString() : undefined"
                    :needed-permissions="['tasks-post']"
                    hide-all
                  />

                  <div>{{ $t('$ezreeport.tasks.dates') }}:</div>
                  <v-container>
                    <DatePicker
                      v-model="task.nextRun"
                      :label="$t('$ezreeport.tasks.nextRun').toString()"
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
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          :disabled="!task || !valid || templateValidation !== true || !perms.create"
          :loading="loading"
          color="success"
          @click="save"
        >
          {{ $t('$ezreeport.save') }}
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
import type { CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isTaskTemplate, mapRulesToVuetify } from '~/stores/template';
import { tabs, type Tab } from './TaskDialogRead.vue';

type CustomCreateTask = Omit<tasks.FullTask, 'createdAt' | 'id' | 'history' | 'namespace' | 'template'> & {
  template: CustomTaskTemplate,
  namespace: string;
};

const minDate = addDays(new Date(), 1);

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
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    task: undefined as CustomCreateTask | undefined,
    currentTab: 0,

    minDate,
    innerValid: false,

    loading: false,
    error: '',
  }),
  watch: {
    value(val: boolean) {
      if (val) {
        this.templateStore.SET_CURRENT({ inserts: [], extends: 'scratch' });
        this.task = {
          name: '',
          template: { extends: 'scratch' } as CustomTaskTemplate,
          targets: [],
          recurrence: 'DAILY' as tasks.Recurrence,
          namespace: '',
          nextRun: minDate,
          enabled: true,
        };
      } else {
        this.templateStore.SET_CURRENT(undefined);
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
          (v: string) => !!v || this.$t('$ezreeport.errors.empty'),
        ],
        targets: [
          (v: string[]) => v.length > 0 || this.$t('$ezreeport.errors.empty'),
          (v: string[]) => v.every(this.validateMail) || this.$t('$ezreeport.errors.email_format'),
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
      data[0] = { ...detailTab, valid: this.valid || this.$t('$ezreeport.tasks.errors._default').toString() };
      data[2] = { ...templateTab, valid: this.templateValidation };

      // Remove unnecessary tabs
      data.splice(1, 1); // activityTab

      return data.map((tab) => ({ ...tab, valid: tab.valid ?? true }));
    },
    /**
     * Form validation state + name validation, which is outside of form
     */
    valid: {
      get(): boolean {
        return this.innerValid
          && this.rules.name.every((rule) => rule(this.task?.name ?? '') === true);
      },
      set(value: boolean) {
        this.innerValid = value;
      },
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
      const valid = this.templateStore.isCurrentValid;
      if (!this.task || valid === true) {
        return true;
      }

      let err = this.$t(valid.i18nKey);
      if (valid.figure !== undefined) {
        err = this.$t('$ezreeport.figures.errors._detail', { valid: err, at: valid.figure });
      }
      if (valid.layout !== undefined) {
        err = this.$t('$ezreeport.layouts.errors._detail', { valid: err, at: valid.layout });
      }
      return err.toString();
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
      if (!this.task || !this.valid || this.templateValidation !== true) {
        return;
      }

      if (!this.perms.create) {
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

        const { content } = await this.$ezReeport.sdk.tasks.createTask(
          {
            name: this.task.name,
            namespace: this.task.namespace,
            template,
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
