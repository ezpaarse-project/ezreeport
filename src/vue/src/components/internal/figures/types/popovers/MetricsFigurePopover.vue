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
          <div class="d-flex" style="gap: 2rem">
            <v-combobox
              :value="innerDataKey"
              :label="$t('$ezreeport.fetchOptions.aggName')"
              :items="availableAggs"
              :readonly="readonly"
              :rules="rules.dataKey"
              item-value="name"
              item-text="name"
              hide-details="auto"
              @update:search-input="innerDataKey = $event"
              @blur="onLabelKeyUpdated"
            >
              <template #append-outer>
                <ElasticAggTypeHelper
                  v-model="showDefinition"
                  :agg="currentAgg"
                />
              </template>
            </v-combobox>

            <v-text-field
              v-model="innerField"
              :label="$t('headers.field')"
              :readonly="readonly"
              :rules="rules.field"
              placeholder="value"
              persistent-placeholder
              hide-details="auto"
              @blur="onLabelKeyUpdated"
            />
          </div>
        </v-card-title>

        <v-card-text>
          <v-text-field
            :value="element.text"
            :label="$t('headers.text')"
            :readonly="readonly"
            :placeholder="innerDataKey"
            persistent-placeholder
            @input="onLabelUpdated({ text: $event || undefined })"
          />

          <!-- Format type -->
          <v-select
            :value="element.format?.type || ''"
            :label="$t('headers.type')"
            :items="possibleFormatTypes"
            :readonly="readonly"
            hide-details="auto"
            placeholder="value"
            persistent-placeholder
            @change="onLabelFormatUpdated({ type: $event || undefined })"
          />

          <!-- TODO: Since only date/number is supported, and they only take one argument -->
          <template v-if="element.format?.type">
            <!-- Format -->
            <v-text-field
              :value="element.format?.params?.[0] || ''"
              :label="$t('headers.formatParams')"
              :readonly="readonly"
              :placeholder="defaultFormatParam"
              :persistent-placeholder="defaultFormatParam !== undefined"
              hide-details="auto"
              @input="onLabelFormatUpdated({ params: $event ? [$event] : undefined })"
            />
            <!-- Format hints -->
            <span class="text--secondary fake-hint">
              <!-- Date hint -->
              <i18n v-if="element.format.type === 'date'" path="hints.dateFormat" tag="span">
                <template #link>
                  <a
                    href="https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unicode Technical Standard #35
                    <v-icon x-small style="color: inherit;">mdi-open-in-new</v-icon>
                  </a>
                </template>
              </i18n>
              <!-- Default hint -->
              <template v-else-if="formatParamHint">
                {{ formatParamHint }}
              </template>
            </span>
          </template>

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
import { omit, merge, pick } from 'lodash';
import type { Label } from '../forms/MetricsFigureForm.vue';

/**
 * Possible type for formatting a metric
 */
const formatTypes = [
  '',
  'date',
  'number',
];

/**
 * Keys of label supported by the popover
 */
const supportedKeys = [
  '_',
  'dataKey',
  'text',
  'field',
  'format',
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
     * Current metric edited
     */
    element: {
      type: Object as PropType<Label>,
      required: true,
    },
    /**
     * Currents key/field used by other metrics
     */
    currentKeyFields: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * Aggregations available to select
     */
    availableAggs: {
      type: Array as PropType<any[]>,
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
    'update:element': (element: Label) => !!element,
  },
  data: () => ({
    valid: false,

    innerDataKey: '',
    innerField: '',

    showDefinition: false,
  }),
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        dataKey: [
          (v: string) => v?.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'metric/dataKey' }),
          !this.isDuplicate || this.$t('errors.no_duplicate', { field: 'metric/dataKey' }),
        ],
        field: [
          !this.isDuplicate || this.$t('errors.no_duplicate', { field: 'metric/field' }),
        ],
      };
    },
    /**
     * Possible type for formatting a metric with localisation
     */
    possibleFormatTypes() {
      return formatTypes.map((value) => ({
        text: this.$t(`formats.${value || '_other'}`),
        value,
      }));
    },
    /**
     * Default value of format param
     */
    defaultFormatParam() {
      switch (this.element.format?.type) {
        case 'date':
          return 'dd/MM/yyyy';
        case 'number':
          return 'fr';

        default:
          return undefined;
      }
    },
    /**
     * Hint of format param
     */
    formatParamHint() {
      if (!this.element.format) {
        return undefined;
      }
      const key = `hints.${this.element.format.type}Format`;
      if (this.$te(key)) {
        return undefined;
      }
      return this.$t(key).toString();
    },
    /**
     * Set of currents key/field used by other metrics
     */
    currentKeyFieldsSet() {
      return new Set(this.currentKeyFields);
    },
    /**
     * Is the current key/field is a duplicate of any other metric
     */
    isDuplicate() {
      const kF = `${this.innerDataKey}.${this.innerField || 'value'}`;
      const currentKF = `${this.element.dataKey}.${this.element.field || 'value'}`;
      if (currentKF === kF) { return false; }

      return this.currentKeyFieldsSet.has(kF);
    },
    /**
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const element = pick(this.element, supportedKeys);
            this.$emit('update:element', merge({}, element as Label, val));
          },
        };
      }

      const value = omit(this.element, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
    /**
     * Current aggregation targeted
     */
    currentAgg() {
      return this.availableAggs.find(({ name }) => name === this.element.dataKey);
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.innerDataKey = this.element.dataKey;
        this.innerField = this.element.field || '';
      }
    },
  },
  methods: {
    onLabelUpdated(data: Partial<Label>) {
      if (this.valid) {
        this.$emit('update:element', { ...this.element, ...data });
      }
    },
    async onLabelKeyUpdated() {
      await this.$nextTick();
      this.onLabelUpdated({ dataKey: this.innerDataKey, field: this.innerField || undefined });
    },
    onLabelFormatUpdated(data: Partial<Label['format']>) {
      let format: Partial<Label['format']> | undefined = {
        ...(this.element.format ?? {}),
        ...data,
      };

      if (!format.type) {
        format = undefined;
      }

      this.onLabelUpdated({
        format: format as Label['format'],
      });
    },
  },
});
</script>

<style scoped>
.fake-hint {
  font-size: 12px;
  line-height: 12px;
}
</style>

<i18n lang="yaml">
en:
  headers:
    field: 'Precise field'
    text: 'Text to show'
    type: 'Type of data'
    formatParams: 'Params to format data'
  errors:
    no_duplicate: 'This couple Key/Field is already used'
  formats:
    _other: 'Other'
    date: 'Date'
    number: 'Number'
  hints:
    dateFormat: 'Format of the date, based on {link}'
    numberFormat: 'Locale used to format'
fr:
  headers:
    field: 'Champ précis'
    text: 'Texte à afficher'
    type: 'Type de donnée'
    formatParams: 'Paramètre pour formater les données'
  errors:
    no_duplicate: 'Ce couple Clé/Champ est déjà utilisé'
  formats:
    _other: 'Autre'
    date: 'Date'
    number: 'Nombre'
  hints:
    dateFormat: 'Format de la date, basé sur {link}'
    numberFormat: 'Locale utilisée pour formater'
</i18n>
