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

          <ToggleableObjectTree
            v-if="template.fetchOptions"
            :label="$t('headers.fetchOptions').toString()"
            :value="template.fetchOptions"
            class="my-2"
          />

          <ToggleableObjectTree
            v-if="fullTemplate?.renderOptions"
            :label="$t('headers.renderOptions').toString()"
            :value="fullTemplate.renderOptions"
            class="my-2"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col v-if="taskTemplate">
          {{ $t('headers.inserts') }}

          <v-sheet v-for="(insert, i) in (taskTemplate.inserts || [])" :key="i" rounded outlined class="pa-2 mt-2">
            {{ $t('headers.insert', { id: i }) }}
            <v-text-field
              :label="$t('headers.at')"
              :value="insert.at"
              :hint="$t('headers.at-hint')"
              readonly
              type="number"
              min="0"
            />

            {{ $t('headers.figures') }}
            <FigureDetail v-for="(figure, j) in insert.figures" :key="j" :figure="figure" :id="j" />
          </v-sheet>
        </v-col>

        <v-col v-if="fullTemplate">
          {{ $t('headers.layouts') }}

          <v-sheet v-for="(layout, i) in (fullTemplate.layouts || [])" :key="i" rounded outlined class="pa-2 mt-2">
            {{ $t('headers.layout', { id: i }) }}

            <div v-if="!layout.data">
              <!-- Fetcher -->
              <v-select
                :label="$t('headers.fetcher')"
                :value="layout.fetcher || 'elastic'"
                :items="[layout.fetcher || 'elastic']"
                readonly
              />
              <ToggleableObjectTree
                v-if="layout.fetchOptions"
                :label="$t('headers.fetchOptions').toString()"
                :value="layout.fetchOptions"
                class="my-2"
              />
            </div>

            <template v-else>
              <!-- Layout Data -->
              <ToggleableObjectTree
                v-if="typeof layout.data === 'object'"
                :label="$t('headers.data').toString()"
                :value="layout.data"
                class="my-2"
              />
              <v-textarea v-else :value="layout.data" :label="$t('headers.data')" readonly />
            </template>

            {{ $t('headers.figures') }}
            <FigureDetail
              v-for="(figure, j) in layout.figures"
              :key="j"
              :figure="figure"
              :id="j"
              :grid="grid"
            />
          </v-sheet>
        </v-col>
      </v-row>

      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="6">
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

import type { templates, tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

hljs.registerLanguage('json', hlJSON);

export default defineComponent({
  components: { highlightjs: highlightjs.component },
  props: {
    template: {
      type: Object as PropType<templates.FullTemplate['template'] | tasks.FullTask['template']>,
      required: true,
    },
  },
  data: () => ({
    readTemplateDialogShown: false,
    rawTemplateShown: false,

    hlStyle: null as HTMLElement | null,

    extendedTemplate: undefined as templates.FullTemplate | undefined,

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
    taskTemplate(): tasks.FullTask['template'] | undefined {
      if ('extends' in this.template) {
        return this.template;
      }
      return undefined;
    },
    /**
     * The template. If the provided tempalte is from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    fullTemplate(): templates.FullTemplate['template'] | undefined {
      // Not using this.taskTemplate cause of TS casting
      if ('extends' in this.template) {
        return undefined;
      }
      return this.template;
    },
    /**
     * The base template. If the provided tempalte is from a task,
     * return the template that it extends, return self otherwise
     */
    baseTemplate(): templates.FullTemplate['template'] | undefined {
      if (this.taskTemplate) {
        return this.extendedTemplate?.template;
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
  },
  watch: {
    // eslint-disable-next-line func-names
    '$vuetify.theme.dark': function () {
      this.applyHlTheme();
    },
    template() {
      this.fetchBase();
    },
  },
  mounted() {
    this.hlStyle = document.getElementById('hl-style');
    if (!this.hlStyle) {
      this.hlStyle = document.createElement('style');
      this.hlStyle.id = 'hl-style';
      document.head.appendChild(this.hlStyle);
      this.applyHlTheme();
    }
    this.fetchBase();
  },
  destroyed() {
    if (this.hlStyle) {
      this.hlStyle.parentNode?.removeChild(this.hlStyle);
    }
  },
  unmounted() {
    if (this.hlStyle) {
      this.hlStyle.parentNode?.removeChild(this.hlStyle);
    }
  },
  methods: {
    async fetchBase() {
      if (!this.taskTemplate) {
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(
          this.taskTemplate.extends,
        );
        this.extendedTemplate = content;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    applyHlTheme() {
      if (this.hlStyle) {
        this.hlStyle.textContent = this.$vuetify.theme.dark ? hlDark : hlLight;
      }
    },
    async openBaseDialog() {
      await this.fetchBase();
      this.readTemplateDialogShown = true;
    },
  },
});
</script>

<style scoped>

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
    inserts: 'Additional layouts'
    insert: 'Layout #{id}'
    data: 'Figures data'
    at: 'Insert at index'
    at-hint: 'Index is depedent of other inserts'
    layouts: 'Pages'
    layout: 'Page #{id}'
    figures: 'Figures'
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
    inserts: 'Pages additionnelles'
    insert: 'Page #{id}'
    data: 'Données des visualisations'
    at: "Insérer à l'index"
    at-hint: "L'index est dépendant des autres pages additionnelles"
    layouts: 'Pages'
    layout: 'Page #{id}'
    figures: 'Visualisations'
  actions:
    see-extends: 'See base' # TODO: French translation
</i18n>
