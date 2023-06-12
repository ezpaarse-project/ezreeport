<template>
  <v-form v-model="valid">
    <v-text-field
      :value="value.dataKey"
      :label="$t('headers.dataKey')"
      :hint="$t('hints.dataKey')"
      :readonly="readonly"
      persistent-hint
      class="mb-4"
      @input="onParamUpdate({ dataKey: $event || undefined })"
    />

    <v-combobox
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
    </v-combobox>

    <v-text-field
      :value="value.maxLength"
      :label="$t('headers.maxLength')"
      :readonly="readonly"
      type="number"
      min="0"
      hide-details
      @input="onParamUpdate({ maxLength: (+$event) >= 1 ? +$event : undefined })"
    />

    <CustomSection :label="$t('headers.columns').toString()" style="border: none;">
      <template #actions v-if="!readonly">
        <v-btn
          icon
          x-small
          color="success"
          @click="onColumnCreated($event)"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>

      <TablePreviewForm
        :value="value.columns"
        :readonly="readonly"
        :key-prefix="`${value.dataKey}[].`"
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
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { omit, merge } from 'lodash';
import type TablePreviewFormConstructor from './TablePreviewForm.vue';
import { TableColumn } from './TablePreviewForm.vue';

type TablePreviewForm = InstanceType<typeof TablePreviewFormConstructor>;

const templateVars = [
  'length',
];

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
    value: {
      type: Object as PropType<PDFParams>,
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
  data: (vm) => ({
    valid: false,
    innerTitle: vm.value.title,
  }),
  computed: {
    possibleVars() {
      return templateVars.map((text) => ({
        value: `{{ ${text} }}`,
        text,
      }));
    },
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => { this.$emit('input', merge(this.value, val)); },
        };
      }

      const value = omit(this.value, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
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
    async onAutocompleteChoice(choice: string) {
      if (choice) {
        const actual = this.innerTitle;
        await this.$nextTick();
        this.innerTitle = actual + choice;
        (this.$refs.titleCB as HTMLElement)?.focus();
      }
    },
    onParamUpdate(data: Partial<PDFParams>) {
      if (this.valid) {
        this.$emit('input', { ...this.value, ...data });
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
    dataKey: 'Key to get data'
    title: 'Title'
    maxLength: 'Maximum count of rows'
    columns: 'Columns'
    advanced: 'Advanced parameters'
  hints:
    dataKey: 'Needed if provided data is not iterable'
  vars:
    length: 'Actual count of items in table'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    title: 'Titre'
    maxLength: 'Nombre maximum de lignes'
    columns: 'Colonnes'
    advanced: 'Paramètres avancés'
  hints:
    dataKey: 'Obligatoire si les données ne sont pas itérable'
  vars:
    length: "Nombre réel d'éléments dans le tableau"
</i18n>
