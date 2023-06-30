<template>
  <v-menu
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-form v-model="valid">
        <v-card-title>
          <v-text-field
            v-model="innerDataKey"
            :label="$t('headers.dataKey')"
            :rules="rules.dataKey"
            :readonly="readonly"
            hide-details="auto"
            @blur="onColumnUpdated({ dataKey: innerDataKey })"
          />
          <i18n v-if="valid" path="$ezreeport.hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
            <template #code>
              <code>{{ $t('$ezreeport.hints.dot_notation.code') }}</code>
            </template>
          </i18n>
        </v-card-title>

        <v-card-text>
          <v-text-field
            :value="column.header"
            :label="$t('headers.header')"
            :rules="rules.header"
            :readonly="readonly"
            @input="onColumnUpdated({ header: $event })"
          />

          <!-- Advanced -->
          <CustomSection v-if="unsupportedParams.shouldShow">
            <ToggleableObjectTree
              :value="unsupportedParams.value"
              :label="$t('$ezreeport.advanced_parameters').toString()"
              v-on="unsupportedParams.listeners"
            />
          </CustomSection>
        </v-card-text>
      </v-form>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { merge, omit, pick } from 'lodash';
import type { TableColumn } from '../forms/TablePreviewForm.vue';

/**
 * Keys of label supported by the popover
 */
const supportedKeys = [
  '_',
  'header',
  'dataKey',
];

export default defineComponent({
  props: {
    /**
     * Is the popover shown
     */
    value: {
      type: Boolean,
      required: true,
    },
    /**
     * Coordinates of popover
     */
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    /**
     * Current column edited
     */
    column: {
      type: Object as PropType<TableColumn>,
      required: true,
    },
    /**
     * Current key used by other columns
     */
    currentDataKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * Is the popover readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (element: TableColumn) => !!element,
  },
  data: () => ({
    valid: false,

    innerDataKey: '',
  }),
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        dataKey: [
          (v: string) => v.length > 0 || this.$t('$ezreeport.errors.empty'),
          !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
        header: [
          (v: string) => v.length > 0 || this.$t('$ezreeport.errors.empty'),
        ],
      };
    },
    /**
     * Set of currents key used by other columns
     */
    currentDataKeySet() {
      return new Set(this.currentDataKeys);
    },
    /**
     * Is the current key is a duplicate of any other column
     */
    isDuplicate() {
      if (this.column.dataKey === this.innerDataKey) { return false; }

      return this.currentDataKeySet.has(this.innerDataKey);
    },
    /**
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const column = pick(this.column, supportedKeys);
            this.$emit('updated', merge({}, column as TableColumn, val));
          },
        };
      }

      const value = omit(this.column, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.innerDataKey = this.column.dataKey;
      }
    },
  },
  methods: {
    onColumnUpdated(data: Partial<TableColumn>) {
      if (this.valid) {
        this.$emit('updated', { ...this.column, ...data });
      }
    },
  },
});
</script>

<style scoped>
.fake-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 12px;
}
</style>

<i18n lang="yaml">
en:
  headers:
    dataKey: 'Key to get data'
    header: 'Name of the column'
  errors:
    no_duplicate: 'This key is already used'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    header: 'Name of the column'
  errors:
    no_duplicate: 'Cette clé est déjà utilisé'
</i18n>
