<template>
  <v-dialog
    :value="value"
    :fullscreen="tabs[currentTab]?.fullScreen"
    :persistent="!valid"
    max-width="1000"
    scrollable
    @input="$emit('input', $event)"
  >
    <TaskDialogGeneration
      v-if="task && perms.runTask"
      v-model="generationDialogShown"
      :task="task"
      @generated="fetch()"
    />
    <TaskDialogLink
      v-if="task && perms.update"
      ref="taskDialogLink"
      :taskId="task.id"
      :extend-id="task.extends.id"
      :lastExtendId="task.lastExtended?.id"
      :defaultId="templateStore.defaultTemplateId"
      @error="error = $event.message"
      @success="fetch()"
    />

    <v-card :loading="loading" :tile="tabs[currentTab]?.fullScreen">
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
                    :label="$t('$ezreeport.tasks.targets')"
                    :rules="rules.targets"
                    :delimiters="[',']"
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

                  <div>{{ $t('$ezreeport.tasks.dates') }}:</div>
                  <v-container>
                    <v-text-field
                      :value="dates.lastRun"
                      :label="$t('$ezreeport.tasks.lastRun').toString()"
                      prepend-icon="mdi-calendar-arrow-left"
                      disabled
                    />
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
            <InternalTaskActivityTable
              v-if="task"
              :activity="task.activity"
              hide-task
              hide-namespace
            />
          </v-tab-item>

          <v-tab-item>
            <TemplateForm
              v-if="task"
              :last-extended="task.lastExtended"
              :is-modified="isModified"
              @update:link="onLinkUpdate"
            />
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          v-if="perms.runTask"
          :disabled="isModified"
          color="warning"
          @click="showGenerateDialog"
        >
          {{ $t('$ezreeport.generate') }}
        </v-btn>

        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          :disabled="!task || !valid || templateValidation !== true || !isModified"
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
import { defineComponent } from 'vue';
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { addDays, formatISO, parseISO } from 'date-fns';
import isEmail from 'validator/lib/isEmail';
import hash from 'object-hash';

import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isTaskTemplate, mapRulesToVuetify } from '~/stores/template';

import { tabs, type Tab } from './TaskDialogRead.vue';
import type TaskDialogLinkConstructor from './TaskDialogLink.vue';

type TaskDialogLink = InstanceType<typeof TaskDialogLinkConstructor>;

type TemplateLessTask = Omit<tasks.FullTask, 'template'>;

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

    task: undefined as TemplateLessTask | undefined,
    taskHash: '',
    templateHash: '',

    currentTab: 0,

    minDate: addDays(new Date(), 1),
    innerValid: false,

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
        err = this.$t('$ezreeport.figures.errors._detail', { valid: err, at: valid.figure + 1 });
      }
      if (valid.layout !== undefined) {
        err = this.$t('$ezreeport.layouts.errors._detail', { valid: err, at: valid.layout + 1 });
      }
      return err.toString();
    },
    /**
     * If template was modified since last fetch
     */
    isTemplateModified() {
      if (!this.templateStore.current || !this.task) {
        return false;
      }

      if (this.templateStore.extendedId !== this.task.extends.id) {
        return true;
      }

      return hash(this.templateStore.current) !== this.templateHash;
    },
    /**
     * If task was modified since last fetch
     */
    isModified() {
      if (this.isTemplateModified) {
        return true;
      }

      if (!this.task) {
        return false;
      }

      return hash(this.task) !== this.taskHash;
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
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        // Add additional data
        const { template, ...data } = content;
        this.templateStore.SET_CURRENT(template, data.extends.id);
        this.task = data;

        this.taskHash = hash(data);
        this.templateHash = this.templateStore.current ? hash(this.templateStore.current) : '';

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
      if (!this.task || !this.valid || this.templateValidation !== true) {
        return;
      }

      if (!this.id || !this.perms.update) {
        this.$emit('input', false);
        return;
      }

      const template = this.templateStore.GET_CURRENT();
      if (!template || !isTaskTemplate(template) || !this.templateStore.extendedId) {
        return;
      }

      this.loading = true;
      try {
        const nextRun = formatISO(this.task.nextRun, { representation: 'date' });

        const { content } = await this.$ezReeport.sdk.tasks.upsertTask(
          {
            id: this.task.id,
            name: this.task.name,
            template,
            extends: this.templateStore.extendedId,
            targets: this.task.targets,
            recurrence: this.task.recurrence,
            nextRun: parseISO(`${nextRun}T00:00:00.000Z`),
            enabled: this.task.enabled,
          },
        );

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { template: _, ...data } = content;

        this.$emit('updated', content);
        this.task = data;

        this.taskHash = hash(data);
        this.templateHash = this.templateStore.current ? hash(this.templateStore.current) : '';

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
    onLinkUpdate(willBeLinked: boolean) {
      (this.$refs.taskDialogLink as TaskDialogLink)?.open(willBeLinked);
    },
  },
});
</script>

<style scoped>

</style>
