<template>
  <highlightjs language="json" :code="json" />
</template>

<script lang="ts">
import hljs from 'highlight.js/lib/core';
import hlJSON from 'highlight.js/lib/languages/json';
import hlLight from 'highlight.js/styles/stackoverflow-light.css?inline';
import hlDark from 'highlight.js/styles/stackoverflow-dark.css?inline';
import highlightjs from '@highlightjs/vue-plugin';

import { defineComponent, type PropType } from 'vue';

hljs.registerLanguage('json', hlJSON);

export default defineComponent({
  components: { highlightjs: highlightjs.component },
  props: {
    value: {
      type: [] as PropType<any>,
      required: true,
    },
  },
  data: () => ({
    hlStyle: null as HTMLElement | null,
  }),
  computed: {
    json() {
      return JSON.stringify(this.value, undefined, 2);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$vuetify.theme.dark': function () {
      this.applyHlTheme();
    },
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
        this.hlStyle.textContent = this.$vuetify.theme.dark ? hlDark : hlLight;
      }
    },
  },
});
</script>

<style scoped>

</style>
