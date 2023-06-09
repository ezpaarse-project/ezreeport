<template>
  <v-form v-model="valid">
    <!-- Data key -->
    <v-text-field
      :value="value.dataKey"
      :label="$t('headers.dataKey')"
      :readonly="readonly"
      @input="onParamUpdate({ dataKey: $event || undefined })"
    />

    <!-- Title -->
    <v-combobox
      :value="innerTitle"
      :items="possibleVars"
      :label="$t('headers.title')"
      :return-object="false"
      :readonly="readonly"
      no-filter
      hide-details
      ref="titleCB"
      @input="onAutocompleteChoice"
      @update:search-input="innerTitle = $event"
      @blur="onParamUpdate({ title: innerTitle || undefined })"
    >
      <template #item="{ item, on, attrs }">
        <v-list-item two-line v-bind="attrs" v-on="on">
          <v-list-item-content>
            <v-list-item-title>{{ item.value }}</v-list-item-title>
            <v-list-item-subtitle>{{ $t(`vars.${item.text}`) }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>

      <template #append>
        <div />
      </template>
    </v-combobox>

    <!-- Value -->
    <CustomSection
      :label="$t('headers.value').toString()"
      :default-value="true"
      collapsable
    >
      <div class="d-flex align-end">
        <i class="mb-1">
          {{ value.dataKey }}[].
        </i>
        <v-text-field
          :value="value.value.field"
          :label="$t('value.headers.field')"
          :readonly="readonly"
          hide-details
          @input="onSubParamUpdate('value', { field: $event })"
        />
      </div>
      <i18n path="hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
        <template #code>
          <code>{{ $t('hints.dot_notation.code') }}</code>
        </template>
      </i18n>

      <v-text-field
        :value="value.value.title"
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
          {{ value.dataKey }}[].
        </i>
        <v-text-field
          :value="value.label.field"
          :label="$t('label.headers.field')"
          :readonly="readonly"
          hide-details
          @input="onSubParamUpdate('label', { field: $event })"
        />
      </div>
      <i18n path="hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
        <template #code>
          <code>{{ $t('hints.dot_notation.code') }}</code>
        </template>
      </i18n>

      <v-text-field
        :value="value.label.title"
        :label="$t('label.headers.title')"
        :readonly="readonly"
        hide-details
        @input="onSubParamUpdate('label', { title: $event })"
      />

      <v-checkbox
        :input-value="value.label.legend !== null"
        :label="$t('label.headers.showLegend')"
        :readonly="readonly"
        hide-details
        @change="onSubParamUpdate('label', { legend: $event })"
        @click.prevent=""
      />
    </CustomSection>

    <!-- Data Labels -->
    <CustomSection
      :label="$t(value.dataLabel ? 'headers.dataLabel' : 'dataLabel.headers.show').toString()"
      collapsable
    >
      <template #collapse>
        <v-switch
          :input-value="!!value.dataLabel"
          :readonly="readonly"
          dense
          hide-details
          class="mt-0"
          @change="onDataLabelUpdate({ format: $event ? 'numeric' : null })"
          @click.prevent=""
        />
      </template>

      <template v-if="value.dataLabel">
        <v-select
          :value="value.dataLabel.format"
          :items="possibleDataLabelFormats"
          :label="$t('dataLabel.headers.format')"
          :readonly="readonly"
          hide-details
          @change="onDataLabelUpdate({ format: $event })"
        />

        <v-checkbox
          :input-value="value.dataLabel.showLabel"
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
        :label="$t('headers.advanced').toString()"
        v-on="unsupportedParams.listeners"
      />
    </CustomSection>
  </v-form>
</template>

<script lang="ts">
import { pick, merge } from 'lodash';
import { defineComponent, type PropType } from 'vue';

/**
 * Possibles vars in title
 */
const templateVars = [
  'length',
];

/**
 * Possible formats for data labels
 */
const dataLabelFormats = [
  'percent',
  'numeric',
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
    /**
     * Parameters of figure
     */
    value: {
      type: Object as PropType<VegaParams>,
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
  data: (vm) => ({
    valid: false,

    innerTitle: vm.value.title,
  }),
  computed: {
    /**
     * Possible vars in title with localisation
     */
    possibleVars() {
      return templateVars.map((text) => ({
        value: `{{ ${text} }}`,
        text,
      }));
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
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => { this.$emit('input', merge(this.value, val)); },
        };
      }

      const diff = this.objectDiff(this.value, supportedParams);
      return {
        shouldShow: !this.readonly || diff.length > 0,
        value: pick(this.value, diff),
        listeners,
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'value.title': function (title: string) {
      this.innerTitle = title;
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
    async onAutocompleteChoice(choice: string) {
      if (choice) {
        const actual = this.innerTitle;
        await this.$nextTick();
        this.innerTitle = actual + choice;
        (this.$refs.titleCB as HTMLElement)?.focus();
      }
    },
    onParamUpdate(data: Partial<VegaParams>) {
      if (this.valid) {
        this.$emit('input', { ...this.value, ...data });
      }
    },
    onSubParamUpdate<T extends SubVegaParamsKeys>(subParam: T, data: Partial<VegaParams[T]>) {
      const subParamValue = {
        ...(this.value[subParam] ?? {}),
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
    dataKey: 'Key to get data'
    title: 'Title'
    value: 'Data parameters'
    label: 'Series parameter'
    dataLabel: 'Data Labels parameters'
    advanced: 'Advanced parameters'
  hints:
    dot_notation:
      value: 'Support dot notation. Eg: {code}'
      code: 'key.value'
  vars:
    length: 'Actual count of items in figure'
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
    formats:
      numeric: 'Numeric'
      percent: 'Percent'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    title: 'Titre'
    value: 'Paramètres des données'
    label: 'Paramètres des séries'
    dataLabel: 'Paramètres des étiquettes de données'
    advanced: 'Paramètres avancés'
  hints:
    dot_notation:
      value: 'Supporte la notation avec des points. Ex: {code}'
      code: 'cle.valeur'
  vars:
    length: "Nombre réel d'éléments dans la visualisation"
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
    formats:
      numeric: 'Numérique'
      percent: 'Pourcentage'
</i18n>
