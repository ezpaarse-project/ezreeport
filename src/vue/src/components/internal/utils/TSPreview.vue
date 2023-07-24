<template>
  <highlightjs language="ts" :code="ts" />
</template>

<script lang="ts">
import hljs from 'highlight.js/lib/core';
import hlTS from 'highlight.js/lib/languages/typescript';
import hlLight from 'highlight.js/styles/stackoverflow-light.css?inline';
import hlDark from 'highlight.js/styles/stackoverflow-dark.css?inline';
import highlightjs from '@highlightjs/vue-plugin';

import { defineComponent, type PropType } from 'vue';

hljs.registerLanguage('ts', hlTS);

export default defineComponent({
  components: { highlightjs: highlightjs.component },
  props: {
    value: {
      type: [] as PropType<any>,
      required: true,
    },
    isArray: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    hlStyle: null as HTMLElement | null,
  }),
  computed: {
    ts() {
      return this.parseTS(this.value);
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
    parseTSType(value: any, padding = 0) {
      if (value.prototype) {
        let type = 'unknown';
        switch (value.prototype.constructor?.name) {
          case 'String':
          case 'Boolean':
          case 'Number':
            type = value.prototype.constructor?.name?.toLowerCase();
            break;

          default:
            break;
        }
        return type;
      }
      if (typeof value === 'object') {
        return this.parseTS(value, padding + 1);
      }
      return 'unknown';
    },
    parseTS(object: Record<string, any>, padding = 0): string {
      let res = '';
      const p = '\t'.repeat(padding);
      const entries = Object.entries(object);
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of entries) {
        res += `\n\t${p + key}: `;
        if (Array.isArray(value)) {
          if (value.length > 0) {
            res += value.map((v) => this.parseTSType(v, padding)).join(' | ');
          } else {
            res += 'any';
          }
        } else {
          res += this.parseTSType(value, padding);
        }
      }

      return `{${res}\n${p}}${this.isArray ? '[]' : ''}`;
    },
  },
});
</script>

<style scoped>

</style>
