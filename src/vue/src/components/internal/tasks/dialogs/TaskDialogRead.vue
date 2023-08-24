<template>
  <v-dialog
    :fullscreen="tabs[currentTab].fullScreen"
    :value="value"
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

    <v-card :loading="loading" :tile="tabs[currentTab].fullScreen">
      <v-card-title>
        <template v-if="task">
          {{ task.name }}
          <RecurrenceChip size="small" classes="text-body-2 mx-2" :value="task.recurrence" />
        </template>

        <CustomSwitch
          v-if="task"
          :value="task.enabled"
          :disabled="!perms.enable || !perms.disable"
          :label="$t(`$ezreeport.tasks.enabled.${task?.enabled}`).toString()"
          :readonly="loading"
          class="text-body-2"
          reverse
          @click.stop="toggle()"
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
                  :label="`${$t('$ezreeport.tasks.targets')}:`"
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

                <div>{{ $t('$ezreeport.tasks.dates') }}:</div>
                <v-container>
                  <div v-if="task?.lastRun">
                    <v-icon small>
                      mdi-calendar-arrow-left
                    </v-icon>
                    {{ $t('$ezreeport.tasks.lastRun') }}: {{ dates.lastRun }}
                  </div>
                  <div v-if="task?.nextRun">
                    <v-icon small>
                      mdi-calendar-arrow-right
                    </v-icon>
                    {{ $t('$ezreeport.tasks.nextRun') }}: {{ dates.nextRun }}
                  </div>
                </v-container>
              </v-col>
            </v-row>
          </v-tab-item>

          <v-tab-item>
            <InternalTasksActivityTable
              v-if="task"
              :activity="task.activity"
              hide-task
              hide-namespace
            />
          </v-tab-item>

          <v-tab-item>
            <v-select
              :value="task?.lastExtended?.id || task?.extends.id || ''"
              :label="$t('$ezreeport.templates.base')"
              :items="availableTemplates"
              readonly
              outlined
              class="mt-2"
            >
              <template #append-outer>
                <v-icon v-if="!task?.lastExtended" color="success">mdi-link-variant</v-icon>
                <v-icon v-else color="error">mdi-link-variant-off</v-icon>
              </template>

              <template #selection="{ item, on, attrs }">
                <v-list-item v-bind="attrs" v-on="on">
                  <v-list-item-content>
                    <v-list-item-title>{{ item.text }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <MiniTagsDetail :model-value="item.tags" />
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-select>

            <v-row>
              <v-col>
                <v-text-field
                  :value="templateStore.currentFetchOptions?.index"
                  :label="$t('$ezreeport.fetchOptions.index').toString()"
                  readonly
                  dense
                  class="pt-4"
                />
              </v-col>

              <v-col>
                <v-text-field
                  :value="templateStore.currentFetchOptions?.dateField"
                  :label="$t('$ezreeport.fetchOptions.dateField').toString()"
                  readonly
                  dense
                  class="pt-4"
                />
              </v-col>
            </v-row>

            <CustomSection
              :label="$t('$ezreeport.fetchOptions.filters').toString()"
              :collapse-disabled="(templateStore.currentFetchOptions?.filtersCount ?? 0) <= 0"
              collapsable
            >
              <ElasticFilterBuilder
                ref="filterBuilder"
                :value="templateStore.currentFetchOptions?.filters ?? {}"
              />
            </CustomSection>

            <CustomSection :label="$t('$ezreeport.preview').toString()">
              <LayoutPreview
                :layouts="templateStore.currentLayouts"
                :grid="templateStore.currentGrid"
                outlined
              />
            </CustomSection>
          </v-tab-item>
        </v-tabs-items>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn v-if="perms.runTask" color="warning" @click="showGenerateDialog">
          {{ $t('$ezreeport.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { namespaces, tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent } from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore from '~/stores/template';

type TemplateLessTask = Omit<tasks.FullTask, 'template'>;

export type Tab = { name: string, fullScreen?: boolean };

export const tabs: Tab[] = [
  { name: 'details' },
  { name: 'activity' },
  { name: 'template', fullScreen: true },
];

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
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    generationDialogShown: false,

    task: undefined as TemplateLessTask | undefined,
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
    availableTemplates() {
      if (!this.task) {
        return [];
      }

      if (this.task.lastExtended) {
        return [
          {
            value: this.task.lastExtended.id,
            text: this.task.lastExtended.name,
            tags: this.task.lastExtended.tags,
          },
        ];
      }

      return [
        {
          value: this.task.extends.id,
          text: this.task.extends.name,
          tags: this.task.extends.tags,
        },
      ];
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

        const { template, ...data } = content;
        this.templateStore.SET_CURRENT(template, data.extends.id);

        this.task = data;
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
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        const { template, ...data } = content;
        this.templateStore.SET_CURRENT(template, data.extends.id);

        this.task = data;
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
