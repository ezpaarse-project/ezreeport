<template>
  <v-row class="mx-0">
    <TemplateDialogRead
      v-if="taskTemplate && perms.readOne"
      v-model="readTemplateDialogShown"
      :name="taskTemplate.extends"
    />

    <v-col style="position: relative">
      <v-switch :label="$t('show-raw')" v-model="rawTemplateShown" />

      <v-row>
        <!-- Global options -->
        <v-col>
          <v-select
            v-if="taskTemplate"
            :value="taskTemplate.extends"
            :label="$t('headers.base')"
            :items="availableTemplates || [taskTemplate.extends]"
            :readonly="loading"
            @change="onExtendChange"
          >
            <template #append-outer>
              <v-btn v-if="perms.readOne" @click="openBaseDialog()">
                {{ $t('actions.see-extends') }}
              </v-btn>
            </template>
          </v-select>

          <v-select
            v-if="fullTemplate"
            :label="$t('headers.renderer')"
            :value="fullTemplate.renderer || 'vega-pdf'"
            :items="availableRenderer"
            @change="
              fullTemplate
                && onTemplateUpdate({ ...fullTemplate, renderer: $event })
            "
          />

          <v-sheet
            v-if="template.fetchOptions"
            rounded
            outlined
            class="my-2 pa-2"
          >
            <ToggleableObjectTree
              :label="$t('headers.fetchOptions').toString()"
              :value="template.fetchOptions"
              @input="
                !Array.isArray($event)
                  && onTemplateUpdate({ ...template, fetchOptions: $event })
              "
            />
          </v-sheet>

          <v-sheet
            v-if="fullTemplate?.renderOptions"
            rounded
            outlined
            class="my-2 pa-2"
          >
            <ToggleableObjectTree
              :label="$t('headers.renderOptions').toString()"
              :value="fullTemplate.renderOptions"
              @input="
                fullTemplate && !Array.isArray($event)
                  && onTemplateUpdate({ ...fullTemplate, renderOptions: $event })
              "
            />
          </v-sheet>
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

          {{ $t('headers.layouts', { count: mergedLayouts.length }) }}

          <v-tooltip top v-if="layoutValidation !== true" color="warning">
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

            <span>{{ layoutValidation }}</span>
          </v-tooltip>
        </v-card-subtitle>

        <v-divider />

        <v-card-text v-show="!templateEditorCollapsed" class="pb-0" style="height: 650px">
          <v-row style="height: 100%">
            <!--
              TODO:
                - Fix create
            -->
            <LayoutDrawer
              v-model="selectedLayoutIndex"
              :items="mergedLayouts"
              :mode="modes.drawerMode"
              class="ml-n1"
              @update:items="onLayoutListUpdate"
            />

            <v-divider vertical style="margin-left: 1px" />

            <LayoutViewer
              v-if="selectedLayout"
              class="editor-panel ma-0"
              :items="selectedLayout.figures"
              :grid="grid"
              :mode="modes.viewerMode"
              @update:items="onFigureListUpdate"
            />
          </v-row>
        </v-card-text>
      </v-card>

      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="5">
        <JSONPreview :value="template" class="mt-4" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  addAdditionalDataToLayouts,
  type AnyCustomTemplate,
  type CustomTemplate,
  type CustomTaskTemplate,
  type AnyCustomLayout,
  type AnyCustomFigure,
  type CustomTaskLayout,
} from '~/lib/templates/customTemplates';

export default defineComponent({
  props: {
    template: {
      type: Object as PropType<AnyCustomTemplate>,
      default: undefined,
    },
  },
  emits: {
    'update:template': (val: AnyCustomTemplate) => !!val,
    'update:full-template': (val: CustomTemplate) => !!val,
    'update:task-template': (val: CustomTaskTemplate) => !!val,
  },
  data: () => ({
    readTemplateDialogShown: false,
    rawTemplateShown: false,
    templateEditorCollapsed: true,

    availableTemplates: [] as string[],
    availableFetchers: ['', 'elastic'],
    availableRenderer: ['vega-pdf'],

    extendedTemplate: undefined as CustomTemplate | undefined,
    selectedLayoutIndex: 0,

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        realAll: perms?.['templates-get'],
        readOne: perms?.['templates-get-name(*)'],
      };
    },
    /**
     * Template as JSON
     */
    rawTemplate(): string {
      return JSON.stringify(this.template, undefined, 2);
    },
    /**
     * The template of a task. If the provided template isn't from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    taskTemplate(): CustomTaskTemplate | undefined {
      if ('extends' in this.template) {
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
      // Not using this.taskTemplate cause of TS casting
      if ('extends' in this.template) {
        return undefined;
      }
      return this.template;
    },
    /**
     * The base template. If the provided template is from a task,
     * return the template that it extends, return self otherwise
     */
    baseTemplate(): CustomTemplate | undefined {
      if (this.taskTemplate) {
        return this.extendedTemplate;
      }
      return this.fullTemplate;
    },
    /**
     * The grid of the template. Used to get possible slots for figures.
     */
    grid() {
      const grid = this.baseTemplate?.renderOptions?.grid ?? { cols: 2, rows: 2 };
      if (!grid || typeof grid !== 'object' || Array.isArray(grid)) {
        return { cols: 2, rows: 2 };
      }
      return grid as { cols: number, rows: number };
    },
    /**
     * The merged list of the task layouts and the base template
     */
    mergedLayouts(): AnyCustomLayout[] {
      if (this.fullTemplate) {
        return this.fullTemplate.layouts;
      }

      // Base layouts
      const layouts = [...(this.baseTemplate?.layouts ?? [])];
      // Layouts to insert
      const inserts = [...(this.taskTemplate?.inserts ?? [])];
      // eslint-disable-next-line no-restricted-syntax
      for (const layout of inserts) {
        layouts.splice(layout.at, 0, layout);
      }
      return layouts;
    },
    /**
     * The current layout selected, based on layoutIndexSelected
     */
    selectedLayout(): AnyCustomLayout | undefined {
      if (this.selectedLayoutIndex < 0 || this.selectedLayoutIndex >= this.mergedLayouts.length) {
        return undefined;
      }

      return this.mergedLayouts[this.selectedLayoutIndex];
    },
    /**
     * Various modes base on current props for various components
     */
    modes(): { drawerMode: 'view' | 'task-edition' | 'template-edition', viewerMode: 'view' | 'allowed-edition' | 'denied-edition' } {
      if (this.taskTemplate) {
        return {
          drawerMode: 'task-edition',
          viewerMode: this.selectedLayout?.at === undefined ? 'denied-edition' : 'allowed-edition',
        };
      }

      return {
        drawerMode: 'template-edition',
        viewerMode: 'allowed-edition',
      };
    },
    /**
     * Is template layouts valid
     */
    layoutValidation(): true | string {
      const invalidIndex = this.mergedLayouts.findIndex(({ _: { valid } }) => valid !== true);
      if (invalidIndex >= 0) {
        return this.$t(
          'errors.layouts._detail',
          {
            at: invalidIndex,
            valid: this.mergedLayouts[invalidIndex]._.valid,
          },
        ).toString();
      }
      return true;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
      this.fetchBase();
    },
    template() {
      // FIXME: Any edit retrigger fetch
      // this.fetch();
      // this.fetchBase();

      // Show editor if needed
      if ('inserts' in this.template) {
        this.templateEditorCollapsed = (this.template.inserts?.length ?? 0) === 0;
      }
      if ('layouts' in this.template) {
        this.templateEditorCollapsed = this.template.layouts.length === 0;
      }
    },
  },
  mounted() {
    // Fetch some info
    this.fetch();
    this.fetchBase();

    // Show editor if needed
    if ('inserts' in this.template) {
      this.templateEditorCollapsed = (this.template.inserts?.length ?? 0) === 0;
    }
    if ('layouts' in this.template) {
      this.templateEditorCollapsed = this.template.layouts.length === 0;
    }
  },
  methods: {
    /**
     * Test if layout is valid
     *
     * @param layout The layout
     */
    validateLayout(layout: AnyCustomLayout): true | string {
      if (layout._.valid !== true) return layout._.valid;

      const isLayoutEmpty = layout.figures.length === 0;
      if (!isLayoutEmpty) this.$t('errors.figures.length').toString();

      const isLayoutManual = layout.figures.every(({ slots }) => !!slots);
      const isLayoutAuto = layout.figures.every(({ slots }) => !slots);
      if (isLayoutManual === isLayoutAuto) return this.$t('errors.figures.mixed').toString();

      return true;
    },
    /**
     * Fetch all available templates
     */
    async fetch() {
      if (!this.perms.realAll) {
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getAllTemplates();
        this.availableTemplates = content.map(({ name }) => name);
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Fetch base template that the current template is extending
     *
     * Doesn't do anything if it's not the template of task
     */
    async fetchBase() {
      if (!this.taskTemplate || !this.perms.readOne) {
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(
          this.taskTemplate.extends,
        );

        // Add additional data
        content.template.layouts = addAdditionalDataToLayouts(content.template.layouts);

        this.extendedTemplate = content.template as CustomTemplate;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Prepare and open dialog of base template
     */
    async openBaseDialog() {
      await this.fetchBase();
      this.readTemplateDialogShown = true;
    },
    /**
     * Called when the base template change
     *
     * @param value
     */
    onExtendChange(value: string) {
      this.onTemplateUpdate({ ...this.template, extends: value });
      this.fetchBase();
    },
    /**
     * Called when the template is updated
     *
     * @param value The new template
     */
    onTemplateUpdate(value: AnyCustomTemplate) {
      this.$emit('update:template', value);
      if ('layouts' in value) {
        this.$emit('update:full-template', value);
      } else {
        this.$emit('update:task-template', value);
      }
    },
    /**
     * Update template with new layouts
     *
     * @param value The new layouts
     */
    onLayoutListUpdate(value: AnyCustomLayout[]) {
      const items = value.map((l) => ({
        ...l,
        _: {
          ...l._,
          valid: this.validateLayout(l),
        },
      }));

      if (this.taskTemplate) {
        const baseLayoutsIds = this.baseTemplate?.layouts.map(({ _: { id } }) => id) ?? [];
        const inserts = items.filter(
          ({ _: { id } }) => !baseLayoutsIds.includes(id),
        ) as CustomTaskLayout[];

        this.onTemplateUpdate({
          ...this.taskTemplate,
          inserts,
        });
      }

      if (this.fullTemplate) {
        this.onTemplateUpdate({
          ...this.fullTemplate,
          layouts: items,
        });
      }
    },
    /**
     * Update current template with new figures
     *
     * @param value The new figures
     */
    onFigureListUpdate(value: AnyCustomFigure[]) {
      if (!this.selectedLayout) {
        return;
      }

      const invalidIndex = value.findIndex(({ _: { valid } }) => valid !== true);
      let valid: true | string = true;
      if (invalidIndex >= 0) {
        valid = this.$t(
          'errors.figures._detail',
          {
            at: invalidIndex,
            valid: value[invalidIndex]._.valid,
          },
        ).toString();
      }

      const layouts = [...this.mergedLayouts];
      layouts.splice(this.selectedLayoutIndex, 1, {
        ...this.selectedLayout,
        // Set validation state based on figures
        _: {
          ...this.selectedLayout._,
          valid,
        },
        // Set figures
        figures: value,
      });
      this.onLayoutListUpdate(layouts);
    },
  },
});
</script>

<style lang="scss" scoped>
.editor-panel {
  height: 100%;
  flex: 1;
}
</style>

<i18n lang="yaml">
en:
  show-raw: 'Show JSON'
  headers:
    renderer: 'Renderer'
    fetcher: 'Fetcher'
    base: 'Base template'
    fetchOptions: 'Fetch options'
    renderOptions: 'Render options'
    layouts: 'Page editor ({count} pages)'
  actions:
    see-extends: 'See base'
  errors:
    layouts:
      _detail: 'Page {at}: {valid}'
    figures:
      _detail: 'Figure {at}: {valid}'
      length: 'All pages must contains at least one figure'
      mixed: 'All figures must be placed the same way (auto or manually)'
fr:
  show-raw: 'Afficher JSON'
  headers:
    renderer: 'Moteur de rendu'
    fetcher: 'Outil de récupération'
    base: 'Modèle de base'
    fetchOptions: 'Options de récupération'
    renderOptions: 'Options de rendu'
    layouts: 'Éditeur de pages ({count} pages)'
  actions:
    see-extends: 'Voir la base'
  errors:
    layouts:
      _detail: 'Page {at}: {valid}'
    figures:
      _detail: 'Visualisation {at}: {valid}'
      length: 'Chaque page doit contenir au moins une visualisation'
      mixed: 'Toutes les visualisations doivent être placée de la même façon (auto ou manuellement)'
</i18n>
