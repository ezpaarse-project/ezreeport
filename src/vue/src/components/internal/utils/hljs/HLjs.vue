<template>
  <div>
    <highlightjs v-if="ready" :language="language" :code="code" />
    <v-skeleton-loader
      v-else
      class="mx-auto"
      type="image"
    />
  </div>
</template>

<script lang="ts">
import hljs from 'highlight.js/lib/core';
import hljsVue from '@highlightjs/vue-plugin';
import hljsThemeLight from 'highlight.js/styles/stackoverflow-light.css?inline';
import hljsThemeDark from 'highlight.js/styles/stackoverflow-dark.css?inline';

import hljsLangTS from 'highlight.js/lib/languages/typescript';
import hljsLangJSON from 'highlight.js/lib/languages/json';

import { defineComponent } from 'vue';

hljs.registerLanguage('json', hljsLangJSON);
hljs.registerLanguage('typescript', hljsLangTS);

export default defineComponent({
  components: {
    highlightjs: hljsVue.component,
  },
  props: {
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    hlStyle: null as HTMLElement | null,
    ready: false,
  }),
  watch: {
    // eslint-disable-next-line func-names
    '$vuetify.theme.dark': function () {
      this.applyHlTheme();
    },
  },
  mounted() {
    // Prepare highlight.js style if not already present
    this.hlStyle = document.getElementById('hl-style');
    if (!this.hlStyle) {
      this.hlStyle = document.createElement('style');
      this.hlStyle.id = 'hl-style';
      document.head.appendChild(this.hlStyle);
    }
    // Apply dark/light theme
    this.applyHlTheme();

    this.ready = true;
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
     * Apply highlight.js theme
     */
    applyHlTheme() {
      if (this.hlStyle) {
        this.hlStyle.textContent = this.$vuetify.theme.dark ? hljsThemeDark : hljsThemeLight;
      }
    },
  },
});
</script>
