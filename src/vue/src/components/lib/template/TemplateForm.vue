<template>
  <v-row>
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

          <v-icon v-if="!isLayoutsValid" color="warning" small>mdi-alert</v-icon>
        </v-card-subtitle>

        <v-divider />

        <v-card-text v-show="!templateEditorCollapsed" class="pb-0" style="height: 650px">
          <v-row style="height: 100%">
            <!--
              TODO:
                - DO TASKS FIRST (ignore templates)
                - Images/color in sheet
                - Legend about icons
                - Do the same in TemplateDetail
                - Fix create
            -->
            <LayoutDrawer
              v-model="selectedLayoutIndex"
              :items="mergedLayouts"
              :mode="modes.drawerMode"
              @update:items="onLayoutListUpdate"
            />

            <LayoutViewer
              v-if="selectedLayout"
              class="editor-panel ma-0"
              :items="selectedLayout.figures"
              :grid="grid"
              :readonly="modes.isViewerReadonly"
              @update:items="onFigureListUpdate"
            />
          </v-row>
        </v-card-text>
      </v-card>

      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="5">
        <highlightjs language="json" :code="rawTemplate" class="mt-4" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import hljs from 'highlight.js/lib/core';
import hlJSON from 'highlight.js/lib/languages/json';
import hlLight from 'highlight.js/styles/stackoverflow-light.css?inline';
import hlDark from 'highlight.js/styles/stackoverflow-dark.css?inline';
import highlightjs from '@highlightjs/vue-plugin';

import { defineComponent, type PropType } from 'vue';
import {
  addAdditionalDataToLayouts,
  type AnyCustomTemplate,
  type CustomTemplate,
  type CustomTaskTemplate,
  type AnyCustomLayout,
  type AnyCustomFigure,
  type CustomTaskLayout,
} from './customTemplates';

hljs.registerLanguage('json', hlJSON);

export default defineComponent({
  components: {
    highlightjs: highlightjs.component,
  },
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
    templateEditorCollapsed: false,

    hlStyle: null as HTMLElement | null,

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
      // TODO: watch perms
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
    modes(): { drawerMode: 'view' | 'task-edition' | 'template-edition', isViewerReadonly: boolean } {
      if (this.taskTemplate) {
        return {
          drawerMode: 'task-edition',
          isViewerReadonly: this.selectedLayout?.at === undefined,
        };
      }

      return {
        drawerMode: 'template-edition',
        isViewerReadonly: false,
      };
    },
    /**
     * Is template layouts valid
     */
    isLayoutsValid(): boolean {
      return this.mergedLayouts.findIndex(({ _: { hasError } }) => hasError) < 0;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
      this.fetchBase();
    },
    // eslint-disable-next-line func-names
    '$vuetify.theme.dark': function () {
      this.applyHlTheme();
    },
    // template() {
    // FIXME: Any edit retrigger fetch
    // this.fetch();
    // this.fetchBase();
    // },
  },
  mounted() {
    // Add highlight.js style if not already present
    this.hlStyle = document.getElementById('hl-style');
    if (!this.hlStyle) {
      this.hlStyle = document.createElement('style');
      this.hlStyle.id = 'hl-style';
      document.head.appendChild(this.hlStyle);
    }
    this.applyHlTheme();

    // Fetch some info
    this.fetch();
    this.fetchBase();
  },
  /**
   * Called in Vue 2
   */
  destroyed() {
    // Remove highlight.js style
    if (this.hlStyle) {
      this.hlStyle.parentNode?.removeChild(this.hlStyle);
    }
  },
  /**
   * Called in Vue 3
   */
  unmounted() {
    // Remove highlight.js style
    if (this.hlStyle) {
      this.hlStyle.parentNode?.removeChild(this.hlStyle);
    }
  },
  methods: {
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
     * Apply highlight.js theme
     */
    applyHlTheme() {
      if (this.hlStyle) {
        this.hlStyle.textContent = this.$vuetify.theme.dark ? hlDark : hlLight;
      }
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
      if (this.taskTemplate) {
        const baseLayoutsIds = this.baseTemplate?.layouts.map(({ _: { id } }) => id) ?? [];
        const inserts = value.filter(
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
          layouts: value,
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

      const layouts = [...this.mergedLayouts];
      layouts.splice(this.selectedLayoutIndex, 1, {
        ...this.selectedLayout,
        // Set validation state based on figures
        _: {
          ...this.selectedLayout._,
          hasError: value.findIndex(({ _: { hasError } }) => hasError) >= 0,
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
  overflow-y: auto;
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
</i18n>
