<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :readonly="readonly"
      />
    </v-col>

    <v-divider vertical class="mt-4" />
    <v-col>
      <v-form v-if="figureParams" v-model="valid">
        <!-- Data key -->
        <v-combobox
          :value="figureParams?.dataKey"
          :label="$t('$ezreeport.fetchOptions.aggName')"
          :items="availableAggs"
          :readonly="readonly"
          hide-details="auto"
          @input="onParamUpdate({ dataKey: $event || undefined })"
        />

        <!-- Value -->
        <CustomSection
          :label="$t('headers.value').toString()"
          :default-value="true"
          collapsable
        >
          <div class="d-flex align-end">
            <i class="mb-1">
              {{ figureParams.dataKey }}[].
            </i>
            <v-text-field
              :value="figureParams.value?.field"
              :label="$t('value.headers.field')"
              :readonly="readonly"
              hide-details
              @input="onSubParamUpdate('value', { field: $event })"
            />
          </div>
          <i18n path="$ezreeport.hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
            <template #code>
              <code>{{ $t('$ezreeport.hints.dot_notation.code') }}</code>
            </template>
          </i18n>

          <v-text-field
            :value="figureParams.value?.title"
            :label="$t('value.headers.title')"
            :readonly="readonly"
            @input="onSubParamUpdate('value', { title: $event })"
          />
        </CustomSection>

        <!-- Label -->
        <CustomSection
          :label="$t('headers.label').toString()"
          :default-value="true"
          collapsable
        >
          <div class="d-flex align-end">
            <i class="mb-1">
              {{ figureParams.dataKey }}[].
            </i>
            <v-text-field
              :value="figureParams.label?.field"
              :label="$t('label.headers.field')"
              :readonly="readonly"
              hide-details
              @input="onSubParamUpdate('label', { field: $event })"
            />
          </div>
          <i18n path="$ezreeport.hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
            <template #code>
              <code>{{ $t('$ezreeport.hints.dot_notation.code') }}</code>
            </template>
          </i18n>

          <v-text-field
            :value="figureParams.label?.title"
            :label="$t('label.headers.title')"
            :readonly="readonly"
            hide-details
            @input="onSubParamUpdate('label', { title: $event })"
          />

          <v-checkbox
            :input-value="figureParams.label?.legend !== null"
            :label="$t('label.headers.showLegend')"
            :readonly="readonly"
            hide-details
            @change="onSubParamUpdate('label', { legend: $event })"
            @click.prevent=""
          />
        </CustomSection>

        <!-- Data Labels -->
        <CustomSection
          :label="$t(figureParams.dataLabel ? 'headers.dataLabel' : 'dataLabel.headers.show').toString()"
          collapsable
        >
          <template #collapse>
            <v-switch
              :input-value="!!figureParams.dataLabel"
              :readonly="readonly"
              dense
              hide-details
              class="mt-0"
              @change="onDataLabelUpdate({ format: $event ? 'numeric' : null })"
              @click.prevent=""
            />
          </template>

          <template v-if="figureParams.dataLabel">
            <v-row>
              <v-col>
                <v-select
                  :value="figureParams.dataLabel.format"
                  :items="possibleDataLabelFormats"
                  :label="$t('dataLabel.headers.format')"
                  :readonly="readonly"
                  hide-details
                  @change="onDataLabelUpdate({ format: $event })"
                />
              </v-col>

              <v-col>
                <v-select
                  :value="figureParams.dataLabel.position"
                  :items="possibleDataLabelPositions"
                  :label="$t('dataLabel.headers.position')"
                  :readonly="readonly"
                  :placeholder="$t('dataLabel.positions.in')"
                  persistent-placeholder
                  hide-details
                  @change="onDataLabelUpdate({ format: $event })"
                />
              </v-col>
            </v-row>

            <v-checkbox
              :input-value="figureParams.dataLabel.showLabel"
              :label="$t('dataLabel.headers.showLabels')"
              :readonly="readonly"
              hide-details
              @change="onDataLabelUpdate({ showLabel: $event })"
              @click.prevent=""
            />
          </template>

        </CustomSection>

        <!-- Advanced -->
        <CustomSection v-if="unsupportedParams.shouldShow">
          <ToggleableObjectTree
            :value="unsupportedParams.value"
            :label="$t('$ezreeport.advanced_parameters').toString()"
            v-on="unsupportedParams.listeners"
          />
        </CustomSection>
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { pick, merge, omit } from 'lodash';
import { defineComponent } from 'vue';
import useTemplateStore from '~/stores/template';

/**
 * Possible formats for data labels
 */
const dataLabelFormats = [
  'percent',
  'numeric',
];

/**
 * Possible positions for data labels
 */
const dataLabelPositions = [
  'in',
  'out',
];

type VegaParams = {
  title: string,
  dataKey: string,
  value: Record<string, any>,
  label: Record<string, any>,
  dataLabel?: {
    format: string,
    showLabel?: boolean,
    minValue?: number,
    position?: string,
  },
};
type SubVegaParamsKeys = Exclude<keyof VegaParams, 'title' | 'dataKey'>;

type DataLabelUpdate = {
  format?: string | null,
  showLabel?: boolean,
  minValue?: number,
};

/**
 * Used to detect unsupported params
 *
 * Should reflect VegaParams
 */
const supportedParams = {
  title: '',
  dataKey: '',
  value: {
    field: '',
    title: '',
  },
  label: {
    field: '',
    title: '',
    legend: {},
  },
  dataLabel: {
    format: '',
    showLabel: [false, undefined],
    minValue: [0, undefined],
  },
};

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    /**
     * Is the form readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (val: VegaParams) => !!val,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,
  }),
  computed: {
    layout() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      return layout;
    },
    figureParams: {
      get(): VegaParams | undefined {
        const figure = this.layout?.figures.find(({ _: { id } }) => id === this.id);
        if (!figure?.params) {
          return undefined;
        }
        // TODO: Better Validation
        return figure.params as VegaParams;
      },
      set(params: VegaParams) {
        const figure = this.layout?.figures.find(({ _: { id } }) => id === this.id);
        if (!figure) {
          return;
        }

        this.templateStore.UPDATE_FIGURE(
          this.layoutId,
          this.id,
          {
            ...figure,
            params,
          },
        );
      },
    },
    /**
     * Possible formats for data labels with localisation
     */
    possibleDataLabelFormats() {
      return dataLabelFormats.map((value) => ({
        text: this.$t(`dataLabel.formats.${value}`),
        value,
      }));
    },
    /**
     * Possible positions for data labels with localisation
     */
    possibleDataLabelPositions() {
      return dataLabelPositions.map((value) => ({
        text: this.$t(`dataLabel.positions.${value}`),
        value,
      }));
    },
    /**
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      const diff = this.objectDiff(this.figureParams ?? {}, supportedParams);

      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const params = omit(this.figureParams, diff);
            this.figureParams = merge({}, params as VegaParams, val);
          },
        };
      }

      return {
        shouldShow: !this.readonly || diff.length > 0,
        value: pick(this.figureParams, diff),
        listeners,
      };
    },
    /**
     * Available aggregations
     */
    availableAggs() {
      if (!this.layout?.fetchOptions) {
        return [];
      }

      const aggs = 'aggs' in this.layout.fetchOptions ? this.layout.fetchOptions.aggs : this.layout.fetchOptions.aggregations;
      if (!Array.isArray(aggs)) {
        return [];
      }

      const available = (aggs as { name: string }[]).map((agg, i) => agg.name || `agg${i}`);
      if (this.layout.fetchOptions?.fetchCount) {
        available.push(this.layout.fetchOptions.fetchCount.toString());
      }
      return available;
    },
  },
  methods: {
    /**
     * Gets difference between 2 objects
     *
     * @param v1 First object to compare
     * @param v2 Second object to compare
     * @param prefix Prefix of returned keys. Should be empty on the first iteration
     *
     * @returns Keys that are in v1 but not in v2
     */
    objectDiff(
      v1: Record<string, any>,
      v2: Record<string, any>,
      prefix = '',
    ) {
      const diffs = Object.keys(v1 ?? {}).reduce(
        (d: string[], key: string) => {
          const prefixedKey = `${prefix}${key}`;
          if (
            Array.isArray(v2[key])
              ? !v2[key].map((v: any) => typeof v).includes(typeof v1[key])
              : typeof v1[key] !== typeof v2[key]
          ) {
            d.push(prefixedKey);
          } else if (typeof v1[key] === 'object' && !Array.isArray(v1[key])) {
            d.push(
              ...this.objectDiff(
                v1[key],
                v2[key],
                `${prefixedKey}.`,
              ),
            );
          }
          return d;
        },
        [],
      );
      return diffs;
    },
    onParamUpdate(data: Partial<VegaParams>) {
      if (this.valid && this.figureParams) {
        this.figureParams = { ...this.figureParams, ...data };
      }
    },
    onSubParamUpdate<T extends SubVegaParamsKeys>(subParam: T, data: Partial<VegaParams[T]>) {
      if (!this.figureParams) {
        return;
      }

      const subParamValue = {
        ...(this.figureParams[subParam] ?? {}),
        ...(data ?? {}),
      };
      this.onParamUpdate({ [subParam]: subParamValue });
    },
    onDataLabelUpdate(data: DataLabelUpdate) {
      if (data.format === null) {
        this.onParamUpdate({ dataLabel: undefined });
        return;
      }
      this.onSubParamUpdate('dataLabel', data as Partial<VegaParams['dataLabel']>);
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
    value: 'Data parameters'
    label: 'Series parameter'
    dataLabel: 'Data Labels parameters'
  value:
    headers:
      field: 'Field'
      title: 'Title of axis'
  label:
    headers:
      field: 'Field'
      title: 'Title of axis'
      showLegend: 'Should show legend ?'
  dataLabel:
    headers:
      show: 'Should show data labels ?'
      format: 'Values format'
      showLabels: 'Should show labels ?'
      position: 'Position'
    formats:
      numeric: 'Numeric'
      percent: 'Percent'
    positions:
      in: 'In'
      out: 'Out'
fr:
  headers:
    value: 'Paramètres des données'
    label: 'Paramètres des séries'
    dataLabel: 'Paramètres des étiquettes de données'
  value:
    headers:
      field: 'Champ'
      title: "Titre de l'axe"
  label:
    headers:
      field: 'Champ'
      title: "Titre de l'axe"
      showLegend: 'Afficher la légende ?'
  dataLabel:
    headers:
      show: 'Afficher les étiquettes de données ?'
      format: 'Format des données'
      showLabels: 'Afficher les labels ?'
      position: 'Position'
    formats:
      numeric: 'Numérique'
      percent: 'Pourcentage'
    positions:
      in: 'Intérieur'
      out: 'Extérieur'
</i18n>
