<template>
  <v-row>
    <v-col>
      <v-switch :label="$t('show-raw')" v-model="showRaw" />

      <v-row>
        <!-- Global options -->
        <v-col>
          <v-select
            v-if="'extends' in template"
            :label="$t('headers.base')"
            :value="template.extends || ''"
            :items="[template.extends || '']"
            readonly />
          <v-select
            v-else
            :label="$t('headers.renderer')"
            :value="template.renderer || 'vega-pdf'"
            :items="availableRenderer"
            readonly />

          <ToggleableObjectTree
            v-if="template.fetchOptions"
            :label="$t('headers.fetchOptions').toString()"
            :value="template.fetchOptions"
            class="my-2" />

          <ToggleableObjectTree
            v-if="'renderOptions' in template && template.renderOptions"
            :label="$t('headers.renderOptions').toString()"
            :value="template.renderOptions"
            class="my-2" />
        </v-col>
      </v-row>

      <v-row>
        <v-col v-if="'inserts' in template">
          <div>{{ $t('headers.inserts') }}</div>
          <v-sheet v-for="(insert, i) in (template.inserts || [])" :key="i" rounded outlined class="pa-2 mt-2">
            {{ $t('headers.insert', { id: i }) }}
            <v-text-field :label="$t('headers.at')" :value="insert.at" readonly type="number" min="0" />
            <FigureDetail v-for="(figure, j) in insert.figures" :key="j" :figure="figure" :id="j" />
          </v-sheet>
        </v-col>

        <v-col v-if="'layouts' in template">
          <div>{{ $t('headers.layouts') }}</div>
          <v-sheet v-for="(layout, i) in (template.layouts || [])" :key="i" rounded outlined class="pa-2 mt-2">
            {{ $t('headers.layout', { id: i }) }}

            <ToggleableObjectTree
              v-if="layout.fetchOptions"
              :label="$t('headers.fetchOptions').toString()"
              :value="layout.fetchOptions"
              class="my-2" />

            <FigureDetail v-for="(figure, j) in layout.figures" :key="j" :figure="figure" :id="j" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="showRaw" cols="6">
        <highlightjs language="json" :code="json(template)" class="mt-4" />
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
    hlStyle: null as HTMLElement | null,
    showRaw: false,
    availableFetchers: ['elastic'],
    availableRenderer: ['vega-pdf'],
  }),
  watch: {
    // eslint-disable-next-line func-names
    '$vuetify.theme.dark': function () {
      this.applyHlTheme();
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
  },
  destroyed() {
    if (this.hlStyle) {
      document.head.removeChild(this.hlStyle);
    }
  },
  unmounted() {
    if (this.hlStyle) {
      document.head.removeChild(this.hlStyle);
    }
  },
  methods: {
    json(value: unknown): string {
      return JSON.stringify(value, undefined, 2);
    },
    applyHlTheme() {
      if (this.hlStyle) {
        this.hlStyle.textContent = this.$vuetify.theme.dark ? hlDark : hlLight;
      }
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
    base: 'Base template'
    fetchOptions: 'Fetch options'
    inserts: 'Additional layouts'
    insert: 'Layout #{id}'
    at: 'Insert at index'
    at-hint: 'Index is depedent of other inserts'
    layouts: 'Pages'
    layout: 'Page #{id}'
  types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Metrics'
fr:
  show-raw: 'Afficher JSON'
  headers:
    renderer: 'Moteur de rendu'
    base: 'Modèle de base'
    fetchOptions: 'Options de récupération'
    inserts: 'Pages additionnelles'
    insert: 'Page #{id}'
    at: "Insérer à l'index"
    at-hint: "L'index est dépendant des autres pages additionnelles"
    layouts: 'Pages'
    layout: 'Page #{id}'
  types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Métriques'
</i18n>
