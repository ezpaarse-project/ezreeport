<template>
  <HLjs language="typescript" :code="ts" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
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
  computed: {
    ts() {
      return this.parseTS(this.value);
    },
  },
  methods: {
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
