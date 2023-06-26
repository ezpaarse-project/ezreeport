<template>
  <v-row class="mx-0">
    <TemplateDialogRead
      v-if="taskTemplate && readTemplateDialogShown && perms.readOne"
      v-model="readTemplateDialogShown"
      :name="taskTemplate.extends"
      @input="loadTemplateBackup"
    />

    <v-col style="position: relative">
      <v-row>
        <!-- Global options -->
        <v-col>
          <v-select
            v-if="taskTemplate"
            :value="taskTemplate.extends"
            :label="$t('headers.base')"
            :items="templateStore.available || [taskTemplate.extends]"
            :readonly="loading"
            item-value="name"
            item-text="name"
            @change="onTemplateUpdate({ extends: $event })"
          >
            <template #append-outer>
              <v-btn v-if="perms.readOne" @click="openBaseDialog()">
                {{ $t('$ezreeport.open') }}
              </v-btn>
            </template>
          </v-select>

          <div class="d-flex" style="gap: 1rem">
            <v-text-field
              v-if="taskTemplate"
              :value="templateStore.currentFetchOptions?.index"
              :label="$t('$ezreeport.fetchOptions.index').toString()"
              :rules="rules.index"
              dense
              class="pt-4"
              @input="onFetchOptionUpdate({ index: $event })"
            />

            <v-text-field
              :value="templateStore.currentFetchOptions?.dateField"
              :label="$t('$ezreeport.fetchOptions.dateField').toString()"
              :rules="rules.dateField"
              :hint="dateField"
              :placeholder="templateStore.extended?.fetchOptions?.dateField"
              :persistent-placeholder="taskTemplate"
              dense
              class="pt-4"
              @input="onFetchOptionUpdate({ dateField: $event })"
            />
          </div>

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
              @input="onFetchOptionUpdate({ filters: $event })"
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

          {{ $t('headers.layouts', { count: templateStore.currentLayouts.length }) }}

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

      <CustomSection :label="$t('headers.advancedOptions').toString()" :default-value="true" collapsable>
        <v-switch :label="$t('show-raw')" v-model="rawTemplateShown" />

        <v-select
          v-if="fullTemplate"
          :label="$t('headers.renderer')"
          :value="fullTemplate.renderer"
          :items="availableRenderer"
          placeholder="vega-pdf"
          persistent-placeholder
          @change="
            fullTemplate
              && onTemplateUpdate({ ...fullTemplate, renderer: $event })
          "
        />

        <CustomSection>
          <ToggleableObjectTree
            :label="$t('headers.fetchOptions').toString()"
            :value="templateStore.currentFetchOptions?.others ?? {}"
            @input="
              !Array.isArray($event)
                && onFetchOptionUpdate({ ...$event })
            "
          />
        </CustomSection>

        <CustomSection v-if="fullTemplate">
          <ToggleableObjectTree
            :label="$t('headers.renderOptions').toString()"
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
        <JSONPreview :value="templateStore.GET_CURRENT()" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { cloneDeep } from 'lodash';
import { type AnyCustomTemplate, type CustomTemplate, type CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isFullTemplate, isTaskTemplate, mapRulesToVuetify } from '~/stores/template';
import type ElasticFilterBuilderConstructor from '../../utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
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

    availableRenderer: ['vega-pdf'],

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
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readOne: has('templates-get-name(*)'),
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
    selectedLayout() {
      return this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.selectedLayoutId,
      );
    },
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
        error = this.$t('$ezreeport.figures.errors._detail', { at: valid.figure, valid: error });
      }
      if (valid.layout !== undefined) {
        error = this.$t('$ezreeport.layouts.errors._detail', { at: valid.layout, valid: error });
      }
      return error;
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
        ...value,
      };
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      this.onTemplateUpdate({
        fetchOptions: {
          ...(this.templateStore.current?.fetchOptions ?? {}),
          ...value,
        },
      });
    },
    onFilterCreated() {
      const builder = this.$refs.filterBuilder as ElasticFilterBuilder | undefined;
      builder?.onElementCreated();
    },
    loadTemplateBackup() {
      this.template = cloneDeep(this.currentTemplateBackup);
      this.currentTemplateBackup = undefined;
    },
  },
});
</script>

<style lang="scss" scoped>
</style>

<i18n lang="yaml">
en:
  show-raw: 'Show JSON'
  headers:
    renderer: 'Renderer'
    fetcher: 'Fetcher'
    base: 'Base template'
    fetchOptions: 'Fetch options'
    fetchFilters: 'Filters'
    fetchIndex: 'Elastic index'
    advancedOptions: 'Advanced options'
    renderOptions: 'Render options'
    layouts: 'Page editor ({count} pages)'
  actions:
    see-extends: 'See base'
  errors:
    empty: 'This field must be set'
    layouts:
      _detail: 'Page {at}: {valid}'
      length: 'All pages must contains at least one figure'
    figures:
      _detail: 'Figure {at}: {valid}'
      slots: 'This combinaison of slots is not possible'
fr:
  show-raw: 'Afficher JSON'
  headers:
    renderer: 'Moteur de rendu'
    fetcher: 'Outil de récupération'
    base: 'Modèle de base'
    fetchOptions: 'Options de récupération'
    fetchFilters: 'Filtres'
    fetchIndex: 'Index Elastic'
    advancedOptions: 'Options avancées'
    renderOptions: 'Options de rendu'
    layouts: 'Éditeur de pages ({count} pages)'
  actions:
    see-extends: 'Voir la base'
  errors:
    empty: 'Ce champ doit être rempli'
    layouts:
      _detail: 'Page {at}: {valid}'
      length: 'Chaque page doit contenir au moins une visualisation'
    figures:
      _detail: 'Visualisation {at}: {valid}'
      slots: "Cette combinaison d'emplacement n'est pas possible"
</i18n>
