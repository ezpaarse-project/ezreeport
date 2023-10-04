<template>
  <v-dialog
    :value="value"
    :persistent="!valid || loading"
    width="600"
    @input="$emit('input', $event)"
  >
    <ElasticAggElementForm
      v-if="value"
      :element="element"
      :element-index="elementIndex"
      :used-names="usedNames"
      :readonly="readonly"
      :agg-filter="aggFilter"
      @update:element="(i, el) => $emit('update:element', i, el)"
      @update:loading="onLoading"
      @update:valid="valid = $event"
    >
      <template v-slot:toolbar>
        <!-- Close -->
        <v-btn :loading="loading" icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </ElasticAggElementForm>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AggDefinition, ElasticAgg } from '~/lib/elastic/aggs';

export default defineComponent({
  props: {
    /**
     * Is the dialog shown
     */
    value: {
      type: Boolean,
      required: true,
    },
    /**
     * The current aggregation
     */
    element: {
      type: Object as PropType<ElasticAgg>,
      required: true,
    },
    /**
     * The index of the current aggregation
     */
    elementIndex: {
      type: Number,
      required: true,
    },
    /**
     * Used names by aggregations
     */
    usedNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * Should be readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
    /**
     * Filter to apply when listing aggregations
     */
    aggFilter: {
      type: Function as PropType<(name: string, def: AggDefinition) => boolean>,
      default: () => true,
    },
  },
  emits: {
    /**
     * Triggered when dialog visibility changes
     *
     * @param show The new visibility
     */
    input: (show: boolean) => show !== undefined,
    /**
     * Triggered when current aggregation is updated
     *
     * @param index The index of the current aggregation
     * @param el The new state of the aggregation
     */
    'update:element': (index: number, el: ElasticAgg) => index >= 0 && !!el,
    /**
     * Triggered when element is updated
     *
     * @param loading The new loading state
     */
    'update:loading': (loading: boolean) => loading !== undefined,
  },
  data: () => ({
    valid: false,
    loading: false,
  }),
  methods: {
    onLoading(val: boolean) {
      this.loading = val;
      this.$emit('update:loading', val);
    },
  },
});
</script>
