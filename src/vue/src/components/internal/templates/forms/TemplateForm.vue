<template>
  <v-row class="mx-0">
    <!-- Preview -->
    <v-dialog
      v-if="templateStore.extended && perms.readOne"
      v-model="readTemplateDialogShown"
    >
      <v-card>
        <v-card-title>{{ $t('preview_title', { name: selectedTemplate?.text }) }}</v-card-title>

        <v-card-text>
          <LayoutPreview
            :layouts="templateStore.extended.layouts"
            :grid="templateStore.currentGrid"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-col style="position: relative">
      <v-row>
        <!-- Global options -->
        <v-col>
          <div v-if="taskTemplate" class="d-flex align-center">
            <v-tooltip top>
              <template #activator="{ attrs: tipAttrs, on: tipOn }">
                <div
                  style="flex: 1"
                  v-bind="lastExtended ? tipAttrs : undefined"
                  v-on="lastExtended ? tipOn : undefined"
                >
                  <TemplateSelect
                    :value="
                      lastExtended?.id
                        || templateStore.extendedId
                        || templateStore.defaultTemplateId
                    "
                    :disabled="loading || !!lastExtended"
                    :label="$t('$ezreeport.templates.base').toString()"
                    @input="onExtendedUpdate"
                  />
                </div>
              </template>

              {{ $t('tooltips.no_unlink_extends') }}
            </v-tooltip>

            <div>
              <v-tooltip left v-if="!noLink">
                <template #activator="{ attrs, on }">
                  <span v-bind="attrs" v-on="on">
                    <v-btn
                      :disabled="isModified"
                      icon
                      @click="$emit('update:link', !linked.value)"
                    >
                      <v-icon v-if="linked.value" color="success">mdi-link-variant</v-icon>
                      <v-icon v-else color="error">mdi-link-variant-off</v-icon>
                    </v-btn>
                  </span>
                </template>

                {{ linked.tooltip }}
              </v-tooltip>

              <v-tooltip top v-if="perms.readOne">
                <template #activator="{ attrs, on }">
                  <v-btn
                    icon
                    @click="openBaseDialog()"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>

                {{ $t('tooltips.preview') }}
              </v-tooltip>
            </div>
          </div>

          <v-row>
            <v-col>
              <v-combobox
                v-model="currentIndex"
                :items="templateStore.indices.available"
                :label="$t(
                  taskTemplate ? '$ezreeport.fetchOptions.index' : 'indexTemplate',
                ).toString()"
                :rules="rules.index"
                :filter="indexFilter"
                dense
                class="pt-4"
              />
            </v-col>

            <v-col>
              <v-combobox
                :value="templateStore.currentFetchOptions?.dateField"
                :items="mappingDateItems"
                :label="$t('$ezreeport.fetchOptions.dateField').toString()"
                :rules="rules.dateField"
                :placeholder="templateStore.extended?.fetchOptions?.dateField"
                :persistent-placeholder="!!taskTemplate"
                :return-object="false"
                item-value="key"
                item-text="key"
                dense
                class="pt-4"
                @input="onFetchOptionUpdate({ dateField: $event || undefined })"
              />
            </v-col>
          </v-row>

          <CustomSection
            :label="$t('$ezreeport.fetchOptions.filters').toString()"
            :collapse-disabled="(templateStore.currentFetchOptions?.filtersCount ?? 0) <= 0"
            collapsable
          >
            <template #actions>
              <v-btn
                icon
                x-small
                color="success"
                @click="onFilterCreated"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            <ElasticFilterBuilder
              ref="filterBuilder"
              :value="templateStore.currentFetchOptions?.filters ?? {}"
              :mapping="templateStore.indices.mapping"
              @input="onFilterUpdate"
            />
          </CustomSection>
        </v-col>
      </v-row>

      <v-card
        outlined
        elevation="0"
      >
        <v-card-subtitle class="py-2 pl-2">
          <v-btn
            icon
            x-small
            @click="templateEditorCollapsed = !templateEditorCollapsed"
          >
            <v-icon>mdi-chevron-{{ templateEditorCollapsed === false ? 'up' : 'down' }}</v-icon>
          </v-btn>

          {{ $tc('$ezreeport.templates.editor', templateStore.currentLayouts.length) }}

          <v-tooltip top v-if="areLayoutsValid !== true" color="warning">
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

            <span>{{ areLayoutsValid }}</span>
          </v-tooltip>
        </v-card-subtitle>

        <v-divider />

        <v-card-text
          v-show="!templateEditorCollapsed"
          :class="['pa-0', $vuetify.theme.dark ? 'grey darken-3' : 'grey lighten-4']"
        >
          <v-row class="ma-0" style="height: 600px;">
            <v-col cols="2" class="pa-0" style="height: 100%;">
              <LayoutDrawer
                v-model="selectedLayoutId"
                :mode="modes.drawerMode"
              />
            </v-col>

            <v-divider vertical />

            <v-col class="pa-0" style="margin-left: 1px;">
              <LayoutViewer
                v-if="selectedLayout"
                :value="selectedLayoutId"
                :mode="selectedLayout.at !== undefined ? 'allowed-edition' : modes.viewerMode"
                style="height: 100%;"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <CustomSection
        :label="$t('$ezreeport.advanced_parameters').toString()"
        :default-value="true"
        collapsable
      >
        <v-switch
          :label="$t('$ezreeport.show_json')"
          v-model="rawTemplateShown"
        />

        <CustomSection>
          <ToggleableObjectTree
            :label="$t('$ezreeport.fetchOptions.title').toString()"
            :value="templateStore.currentFetchOptions?.others ?? {}"
            @input="
              !Array.isArray($event)
                && onFetchOptionUpdate({ ...$event })
            "
          />
        </CustomSection>

        <CustomSection v-if="fullTemplate">
          <ToggleableObjectTree
            :label="$t('$ezreeport.templates.renderOptions').toString()"
            :value="fullTemplate.renderOptions || {}"
            @input="
              fullTemplate && !Array.isArray($event)
                && onTemplateUpdate({ ...fullTemplate, renderOptions: $event })
            "
          />
        </CustomSection>
      </CustomSection>

      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="5">
        <JSONPreview :value="rawTemplate" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { cloneDeep, merge, pick } from 'lodash';
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { type AnyCustomTemplate, type CustomTemplate, type CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, {
  isFullTemplate,
  isTaskTemplate,
  mapRulesToVuetify,
  supportedFetchOptions,
} from '~/stores/template';
import { indexFilter } from '~/lib/elastic/indicies';
import type ElasticFilterBuilderConstructor from '../../utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
  props: {
    lastExtended: {
      type: Object as PropType<tasks.FullTask['lastExtended']>,
      default: () => undefined,
    },
    namespace: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    isModified: {
      type: Boolean,
      default: false,
    },
    noLink: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:link': (value: boolean) => value !== undefined,
  },
  mixins: [ezReeportMixin],
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    readTemplateDialogShown: false,
    rawTemplateShown: false,
    templateEditorCollapsed: true,

    currentTemplateBackup: undefined as AnyCustomTemplate | undefined,
    innerIndex: '',

    selectedLayoutId: '',

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * The current edited template
     */
    template: {
      get(): AnyCustomTemplate | undefined {
        if (this.currentTemplateBackup) {
          return this.currentTemplateBackup;
        }
        return this.templateStore.current;
      },
      set(val: AnyCustomTemplate) {
        this.templateStore.current = val;
      },
    },
    /**
     * Options for selecting template
     */
    availableTemplates() {
      const templates = this.templateStore.available.map((t) => ({
        value: t.id,
        text: t.name,
        tags: t.tags,
        found: true,
      }));

      if (
        this.lastExtended
        && !templates.some(({ value }) => value === this.lastExtended?.id)
      ) {
        templates.push({
          value: this.lastExtended.id,
          text: this.lastExtended.name,
          tags: this.lastExtended.tags,
          found: false,
        });
      }

      return templates;
    },
    /**
     * Selected option
     */
    selectedTemplate() {
      return this.availableTemplates.find(({ value }) => value === this.templateStore.extendedId);
    },
    /**
     * Infos about link between template and task
     */
    linked(): { value: boolean, tooltip: string } {
      if (this.noLink) {
        return { value: true, tooltip: '' };
      }

      if (this.lastExtended) {
        return {
          value: false,
          tooltip: this.$t(
            this.isModified ? 'tooltips.no_save_unlink' : 'tooltips.unlink',
          ).toString(),
        };
      }

      return {
        value: true,
        tooltip: this.$t(
          this.isModified ? 'tooltips.no_save_link' : 'tooltips.link',
        ).toString(),
      };
    },
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readOne: has('templates-get-template'),
      };
    },
    /**
     * General validation rules
     */
    rules() {
      return mapRulesToVuetify(this.templateStore.rules.template, (k) => this.$t(k));
    },
    /**
     * The template of a task. If the provided template isn't from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    taskTemplate(): CustomTaskTemplate | undefined {
      if (isTaskTemplate(this.template)) {
        return this.template;
      }

      return undefined;
    },
    /**
     * The template. If the provided template is from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    fullTemplate(): CustomTemplate | undefined {
      if (isFullTemplate(this.template)) {
        return this.template;
      }
      return undefined;
    },
    /**
     * The base template. If the provided template is from a task,
     * return the template that it extends, return self otherwise
     */
    baseTemplate(): CustomTemplate | undefined {
      if (isTaskTemplate(this.template)) {
        return this.templateStore.extended;
      }
      return this.fullTemplate;
    },
    /**
     * Various modes base on current props for various components
     */
    modes(): { drawerMode: 'view' | 'task-edition' | 'template-edition', viewerMode: 'view' | 'allowed-edition' | 'denied-edition' } {
      if (this.taskTemplate) {
        return {
          drawerMode: 'task-edition',
          viewerMode: 'denied-edition',
        };
      }

      return {
        drawerMode: 'template-edition',
        viewerMode: 'allowed-edition',
      };
    },
    /**
     * The selected template to edit it's figures
     */
    selectedLayout() {
      return this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.selectedLayoutId,
      );
    },
    /**
     * The detailed error on any layout
     */
    areLayoutsValid() {
      const layouts = this.templateStore.currentLayouts;
      const index = layouts.findIndex(({ _: { valid } }) => valid !== true);
      const valid = layouts[index]?._.valid ?? true;
      if (valid === true) {
        return true;
      }

      let error = this.$t(valid.i18nKey);
      if (valid.field) {
        error += ` (${valid.field})`;
      }
      if (valid.figure !== undefined) {
        error = this.$t('$ezreeport.figures.errors._detail', { at: valid.figure + 1, valid: error });
      }
      if (valid.layout !== undefined) {
        error = this.$t('$ezreeport.layouts.errors._detail', { at: valid.layout + 1, valid: error });
      }
      return error;
    },
    /**
     * The template without any client side feature (ids, validation, etc.)
     */
    rawTemplate() {
      return this.templateStore.GET_CURRENT();
    },
    currentIndex: {
      get(): string {
        return this.innerIndex || this.templateStore.current?.fetchOptions?.index || '';
      },
      async set(value: string) {
        this.innerIndex = value;
        this.onFetchOptionUpdate({ index: value || undefined });
        await this.onIndexChange();
      },
    },
    mappingDateItems() {
      return this.templateStore.indices.mapping.filter(({ type }) => type === 'date');
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'templateStore.current': function () {
      this.initEditorCollapsed();
    },
  },
  mounted() {
    this.initEditorCollapsed();
    this.templateStore.refreshAvailableTemplates();
  },
  methods: {
    /**
     * Show editor if needed
     */
    initEditorCollapsed() {
      if (this.taskTemplate) {
        this.templateEditorCollapsed = (this.taskTemplate.inserts?.length ?? 0) === 0;
      }

      if (this.fullTemplate) {
        this.templateEditorCollapsed = this.fullTemplate.layouts.length === 0;
      }
    },
    /**
     * Prepare and open dialog of base template
     */
    async openBaseDialog() {
      this.currentTemplateBackup = cloneDeep(this.template);
      await this.$nextTick();
      this.readTemplateDialogShown = true;
    },
    /**
     * Update in store the extended template
     *
     * @param id The id of the extended template
     */
    async onExtendedUpdate(id: string) {
      this.loading = true;
      await this.templateStore.SET_EXTENDED(id);
      this.loading = false;
    },
    /**
     * Called when the template is updated
     *
     * @param value The new template
     */
    onTemplateUpdate(value: Partial<AnyCustomTemplate>) {
      if (!this.template) {
        return;
      }

      this.template = {
        ...this.template,
        ...value as any,
      };
      this.templateStore.validateCurrent();
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      const picked: Record<string, any> = pick(
        this.templateStore.current?.fetchOptions ?? {},
        supportedFetchOptions,
      );
      // Remove undefined properties
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, val] of Object.entries(value)) {
        if (val === undefined) {
          delete picked[key];
        }
      }

      this.onTemplateUpdate({
        fetchOptions: merge({}, picked, value) as any,
      });
    },
    onFilterCreated() {
      const builder = this.$refs.filterBuilder as ElasticFilterBuilder | undefined;
      builder?.onElementCreated();
    },
    onFilterUpdate(filters: Record<string, any>) {
      this.onTemplateUpdate({
        fetchOptions: {
          ...(this.template?.fetchOptions ?? {}),
          filters,
        } as any,
      });
    },
    async onIndexChange() {
      await this.templateStore.fetchCurrentMapping(this.namespace, this.innerIndex);
    },
    indexFilter,
  },
});
</script>

<style lang="scss" scoped>
</style>

<i18n lang="yaml">
en:
  deleted_base: '(deleted)'
  preview_title: 'Preview of {name}'
  indexTemplate: 'Elastic index (used to enable autocomplete)'
  tooltips:
    preview: 'See template'
    link: 'The report is linked to the template, click to unlink'
    unlink: 'The report is unlinked to the template, click to link'
    no_save_link: 'You must save your changes before trying to unlink the template'
    no_save_unlink: 'You must save your changes before trying to link the template'
    no_unlink_extends: 'You must link the template before changing it'
fr:
  deleted_base: '(supprimé)'
  preview_title: 'Prévisualisation de {name}'
  indexTemplate: "Index Elastic (utilisé pour activer l'autocomplétion)"
  tooltips:
    preview: 'Voir le modèle'
    link: 'Le rapport est lié au modèle, cliquer pour le délier'
    unlink: 'Le rapport est délié au modèle, cliquer pour le re-lier'
    no_save_link: "Vous devez sauvegarder vos modifications avant d'essayer de délier le modèle"
    no_save_unlink: "Vous devez sauvegarder vos modifications avant d'essayer de lier le modèle"
    no_unlink_extends: 'Vous devez lier le modèle avant de pouvoir le changer'
</i18n>
