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
      <v-form ref="form" v-model="valid">
        <v-combobox
          :value="figureParams?.dataKey"
          :label="$t('$ezreeport.fetchOptions.aggName')"
          :items="availableAggs"
          :readonly="readonly"
          hide-details="auto"
          @input="onParamUpdate({ dataKey: $event || undefined })"
        />

        <!-- TODO: Move to FigureForm -->
        <!-- <v-combobox
          :value="innerTitle"
          :items="possibleVars"
          :label="$t('headers.title')"
          :return-object="false"
          :readonly="readonly"
          no-filter
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
        </v-combobox> -->

        <v-text-field
          :value="figureParams?.maxLength"
          :label="$t('headers.maxLength')"
          :readonly="readonly"
          type="number"
          @input="onParamUpdate({ maxLength: (+$event) >= 1 ? +$event : undefined })"
        />

        <CustomSection :label="$t('headers.columns').toString()">
          <template #actions v-if="!readonly">
            <v-btn
              :disabled="!valid"
              icon
              x-small
              color="success"
              @click="onColumnCreated($event)"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>

          <TablePreviewForm
            v-if="figureParams"
            :value="figureParams.columns"
            :readonly="readonly"
            :key-prefix="`${figureParams.dataKey}[].`"
            ref="columnsTable"
            @input="onParamUpdate({ columns: $event })"
          />
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
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { omit, merge } from 'lodash';
import useTemplateStore from '~/stores/template';
import type TablePreviewFormConstructor from './TablePreviewForm.vue';
import { TableColumn } from './TablePreviewForm.vue';

type TablePreviewForm = InstanceType<typeof TablePreviewFormConstructor>;

// const templateVars = [
//   'length',
// ];

const supportedKeys = [
  'dataKey',
  'title',
  'maxLength',
  'columns',
];

// Extracted from `src/services/report/...`
type PDFParams = {
  dataKey: string,
  title?: string,
  maxLength?: number,
  columns: TableColumn[]
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
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (val: PDFParams) => !!val,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,
  }),
  computed: {
    figureParams: {
      get(): PDFParams | undefined {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );
        const figure = layout?.figures.find(({ _: { id } }) => id === this.id);

        if (!figure?.params) {
          return undefined;
        }

        const params: PDFParams = { dataKey: '', columns: [] };
        if ('dataKey' in figure.params && typeof figure.params.dataKey === 'string') {
          params.dataKey = figure.params.dataKey;
        }

        if ('columns' in figure.params && Array.isArray(figure.params.columns)) {
          // TODO: Better Validation
          params.columns = figure.params.columns as TableColumn[];
        }

        return params;
      },
      set(params: PDFParams) {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );
        const figure = layout?.figures.find(({ _: { id } }) => id === this.id);

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
    // possibleVars() {
    //   return templateVars.map((text) => ({
    //     value: `{{ ${text} }}`,
    //     text,
    //   }));
    // },
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly && this.valid) {
        listeners = {
          input: (val: Record<string, any>) => {
            this.figureParams = merge(this.figureParams, val);
          },
        };
      }

      const value = omit(this.figureParams, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
    availableAggs() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      if (!layout || !layout.fetchOptions) {
        return [];
      }

      const aggs = 'aggs' in layout.fetchOptions ? layout.fetchOptions.aggs : layout.fetchOptions.aggregations;
      if (!Array.isArray(aggs)) {
        return [];
      }

      return (aggs as { name: string }[]).map((agg, i) => agg.name || `agg${i}`);
    },
  },
  mounted() {
    (this.$refs.form as any)?.validate();
  },
  methods: {
    onParamUpdate(data: Partial<PDFParams>) {
      if (this.valid && this.figureParams) {
        this.figureParams = { ...this.figureParams, ...data };
      }
    },
    onColumnCreated(e: MouseEvent) {
      (this.$refs.columnsTable as TablePreviewForm | undefined)?.createColumn(e);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    title: 'Title'
    maxLength: 'Maximum count of rows'
    columns: 'Columns'
    advanced: 'Advanced parameters'
  vars:
    length: 'Actual count of items in table'
fr:
  headers:
    title: 'Titre'
    maxLength: 'Nombre maximum de lignes'
    columns: 'Colonnes'
    advanced: 'Paramètres avancés'
  vars:
    length: "Nombre réel d'éléments dans le tableau"
</i18n>