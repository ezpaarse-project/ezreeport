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
            :label="$t('headers.base')"
            :value="taskTemplate.extends"
            :items="[taskTemplate.extends]"
            readonly
          >
            <template #append-outer>
              <v-btn
                v-if="perms.readOne"
                :disabled="loading || !taskTemplate"
                @click="openBaseDialog()"
              >
                {{ $t('actions.see-extends') }}
              </v-btn>
            </template>
          </v-select>

          <v-select
            v-if="fullTemplate"
            :label="$t('headers.renderer')"
            :value="fullTemplate.renderer || 'vega-pdf'"
            :items="[fullTemplate.renderer || 'vega-pdf']"
            readonly
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
            />
          </v-sheet>

          <v-sheet
            v-if="fullTemplate?.renderOptions"
            rounded
            outlined
            class="my-2 pa-2"
          >
            <ToggleableObjectTree
              v-if="fullTemplate?.renderOptions"
              :label="$t('headers.renderOptions').toString()"
              :value="fullTemplate.renderOptions"
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
        </v-card-subtitle>

        <v-divider />

        <v-card-text v-show="!templateEditorCollapsed" class="pb-0" style="height: 650px">
          <v-row style="height: 100%">
            <LayoutDrawer
              v-model="selectedLayoutIndex"
              :items="mergedLayouts"
              mode="view"
              class="ml-n1"
            />

            <v-divider vertical style="margin-left: 1px" />

            <LayoutViewer
              v-if="selectedLayout"
              :items="selectedLayout.figures"
              :grid="grid"
              mode="view"
              class="editor-panel ma-0"
            />
          </v-row>
        </v-card-text>
      </v-card>
      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="6">
        <JSONPreview :value="template" class="mt-4" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  addAdditionalDataToLayouts,
  type AnyCustomLayout,
  type AnyCustomTemplate,
  type CustomTaskTemplate,
  type CustomTemplate,
} from '~/lib/templates/customTemplates';

export default defineComponent({
  inject: ['$ezReeport'],
  props: {
    template: {
      type: Object as PropType<AnyCustomTemplate>,
      required: true,
    },
  },
  data: () => ({
    readTemplateDialogShown: false,
    rawTemplateShown: false,
    templateEditorCollapsed: true,

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
      const perms = this.$ezReeport.data.auth.permissions;
      return {
        readOne: perms?.['templates-get-name(*)'],
      };
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
        return undefined;
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
  },
  watch: {
    template() {
      this.fetchBase();

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
    layouts: 'Page viewer ({count} pages)'
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
    layouts: 'Visionneur de pages ({count} pages)'
  actions:
    see-extends: 'Voir la base'
</i18n>
