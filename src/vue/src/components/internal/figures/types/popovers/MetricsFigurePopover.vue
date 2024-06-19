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
        <v-card-text>
          <ElasticAggElementForm
            v-if="linkedAgg"
            :element="linkedAgg"
            :mapping="mapping"
            :readonly="readonly"
            :agg-filter="aggFilter"
            :style="{
              border: $vuetify.theme.dark ? 'thin solid rgba(255, 255, 255, 0.12)' : 'thin solid rgba(0, 0, 0, 0.12)',
            }"
            @update:element="(i, el) => $emit('update:linkedAgg', el)"
            @update:loading="onAggLoading"
          >
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ $t('headers.linkedAgg') }}

                <v-progress-circular v-if="aggLoading" indeterminate size="16" width="2" class="ml-2" />
              </div>
            </template>
          </ElasticAggElementForm>

          <CustomSection :label="$t('headers.type').toString()" collapsable>
            <!-- Format type -->
            <v-select
              :value="element.format?.type || ''"
              :items="possibleFormatTypes"
              :readonly="readonly"
              class="mt-0"
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
          </CustomSection>

          <!-- Element text -->
          <v-text-field
            v-model="innerTitle"
            :label="$t('headers.text')"
            :readonly="readonly"
            :placeholder="element._.dataKeyField"
            hide-details="auto"
            persistent-placeholder
            class="px-1"
            @blur="onLabelUpdated({ text: innerTitle || undefined })"
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
import { omit, merge, pick } from 'lodash';

import type { AggDefinition, ElasticAgg } from '~/lib/elastic/aggs';

import type { CustomLabel } from '../forms/MetricsFigureForm.vue';

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
  'text',
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
      type: Object as PropType<CustomLabel>,
      required: true,
    },
    linkedAgg: {
      type: Object as PropType<ElasticAgg | undefined>,
      default: undefined,
    },
    mapping: {
      type: Array as PropType<{ key: string, type: string }[]>,
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
    'update:element': (element: CustomLabel) => !!element,
    'update:linkedAgg': (agg: ElasticAgg) => !!agg,
    'update:loading': (loading: boolean) => loading !== undefined,
  },
  data: () => ({
    valid: false,

    innerTitle: '',

    aggLoading: false,
  }),
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        dataKey: [
          (v: string) => v?.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'metric/dataKey' }),
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
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const element = pick(this.element, supportedKeys);
            this.$emit('update:element', merge({}, element as CustomLabel, val));
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
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.innerTitle = this.element.text ?? '';
      }
    },
  },
  methods: {
    onLabelUpdated(data: Partial<CustomLabel>) {
      if (this.valid) {
        this.$emit('update:element', { ...this.element, ...data });
      }
    },
    onLabelFormatUpdated(data: Partial<CustomLabel['format']>) {
      let format: Partial<CustomLabel['format']> | undefined = {
        ...(this.element.format ?? {}),
        ...data,
      };

      if (!format.type) {
        format = undefined;
      }

      this.onLabelUpdated({
        format: format as CustomLabel['format'],
      });
    },
    aggFilter(name: string, def: AggDefinition): boolean {
      return !def.returnsArray && !/^__/i.test(name);
    },
    onAggLoading(value: boolean) {
      this.aggLoading = value;
      this.$emit('update:loading', value);
    },
  },
});
</script>

<i18n lang="yaml">
en:
  headers:
    field: 'Precise field'
    text: 'Text to show'
    type: 'Type of data'
    formatParams: 'Params to format data'
    linkedAgg: 'Aggregation'
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
    linkedAgg: 'Agrégation'
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
