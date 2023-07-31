<template>
  <v-dialog
    :value="value"
    :persistent="!valid"
    absolute
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-form v-model="valid">
        <v-card-title>
          <div class="d-flex align-end">
            <i style="font-size: 0.8em;">
              {{ keyPrefix }}
            </i>
            <v-text-field
              v-model="innerDataKey"
              :label="$t('headers.dataKey')"
              :rules="rules.dataKey"
              :readonly="readonly"
              hide-details="auto"
              @blur="onColumnUpdated({ dataKey: innerDataKey })"
            />
          </div>
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

          <v-checkbox
            :label="$t('headers.total')"
            :input-value="total"
            :readonly="readonly"
            hide-details
            class="mt-0"
            @change="$emit('update:total', $event)"
          />

          <!-- Style -->
          <CustomSection
            :label="$t('headers.style.title').toString()"
            :default-value="true"
            collapsable
          >
            <v-select
              :value="colStyle.overflow"
              :label="$t('headers.style.overflow')"
              :items="overflowOptions"
              :placeholder="$t('overflow_list.ellipsize')"
              persistent-placeholder
              hide-details
              @change="onColStyleUpdate({ overflow: $event })"
            />

            <v-select
              :value="colStyle.halign"
              :label="$t('headers.style.halign')"
              :items="alignOptions"
              :placeholder="$t('align_list.left')"
              persistent-placeholder
              hide-details
              @change="onColStyleUpdate({ halign: $event })"
            />

            <v-select
              :value="colStyle.valign"
              :label="$t('headers.style.valign')"
              :items="alignOptions"
              :placeholder="$t('align_list.center')"
              persistent-placeholder
              hide-details
              @change="onColStyleUpdate({ valign: $event })"
            />
          </CustomSection>

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
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { merge, omit, pick } from 'lodash';
import type { PDFStyle, TableColumn } from '../utils/table';

/**
 * Keys of label supported by the popover
 */
const supportedKeys = [
  '_',
  'header',
  'dataKey',
];

/**
 * Possible overflow for text
 */
const possibleOverflows = [
  'linebreak',
  'ellipsize',
  'visible',
  'hidden',
];

/**
 * Possible alignement in cell
 */
const possibleAligns = [
  'left',
  'right',
  'center',
  'justify',
];

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
     * Current column edited
     */
    column: {
      type: Object as PropType<TableColumn>,
      required: true,
    },
    /**
     * Should show total of column
     */
    total: {
      type: Boolean,
      default: false,
    },
    /**
     * Should show total of column
     */
    colStyle: {
      type: Object as PropType<PDFStyle>,
      default: () => ({}),
    },
    /**
     * Current key used by other columns
     */
    currentDataKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * The prefix of the field
     */
    keyPrefix: {
      type: String,
      default: '',
    },
    /**
     * Is the dialog readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    'update:column': (element: TableColumn) => !!element,
    'update:total': (total: boolean) => total !== undefined,
    'update:colStyle': (style: PDFStyle) => !!style,
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
            this.$emit('update:column', merge({}, column as TableColumn, val));
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
    overflowOptions() {
      return possibleOverflows.map((value) => ({
        text: this.$t(`overflow_list.${value}`).toString(),
        value,
      })).sort((a, b) => a.text.localeCompare(b.text));
    },
    alignOptions() {
      return possibleAligns.map((value) => ({
        text: this.$t(`align_list.${value}`).toString(),
        value,
      })).sort((a, b) => a.text.localeCompare(b.text));
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.innerDataKey = this.column.dataKey;
      }
    },
  },
  mounted() {
    this.innerDataKey = this.column.dataKey;
  },
  methods: {
    onColumnUpdated(data: Partial<TableColumn>) {
      if (this.valid) {
        this.$emit('update:column', { ...this.column, ...data });
      }
    },
    onColStyleUpdate(data: Partial<PDFStyle>) {
      if (this.valid) {
        this.$emit('update:colStyle', { ...this.colStyle, ...data });
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
    total: 'Show total'
    style:
      title: 'Styling options'
      overflow: 'Overflow'
      valign: "Vertical align"
      halign: "Horizontal align"
  overflow_list:
    linebreak: 'Line break'
    ellipsize: 'Shorten using ellipsis'
    visible: 'Visible'
    hidden: 'Hidden'
  align_list:
    left: 'Left'
    right: 'Right'
    center: 'Center'
    justify: 'Justify'
  errors:
    no_duplicate: 'This key is already used'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    header: 'Name of the column'
    total: 'Afficher le total'
    style:
      title: 'Options de style'
      overflow: 'Débordement'
      valign: "Alignement vertical"
      halign: "Alignement horizontal"
  overflow_list:
    linebreak: 'Retour à la ligne'
    ellipsize: 'Mettre des points de suspensions'
    visible: 'Laisser dépasser'
    hidden: 'Tronquer'
  align_list:
    left: 'Gauche'
    right: 'Droite'
    center: 'Centrer'
    justify: 'Justifier'
  errors:
    no_duplicate: 'Cette clé est déjà utilisé'
</i18n>
../forms/utils/table
