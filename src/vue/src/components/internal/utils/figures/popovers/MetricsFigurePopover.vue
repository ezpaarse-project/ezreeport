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
            :readonly="readonly"
            :rules="rules.dataKey"
            hide-details="auto"
            @blur="onLabelUpdated({ dataKey: innerDataKey, field: innerField || undefined })"
          />
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="innerField"
            :label="$t('headers.field')"
            :readonly="readonly"
            :rules="rules.field"
            placeholder="value"
            persistent-placeholder
            @blur="onLabelUpdated({ dataKey: innerDataKey, field: innerField || undefined })"
          />

          <v-text-field
            :value="element.text"
            :label="$t('headers.text')"
            :readonly="readonly"
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

          <!-- TODO: Since only date is supported, and date only take one argument -->
          <!-- Format -->
          <v-text-field
            :value="element.format?.params?.[0] || ''"
            :label="$t('headers.formatParams')"
            :readonly="readonly"
            :disabled="!element.format?.type"
            hide-details="auto"
            @input="onLabelFormatUpdated({ params: $event ? [$event] : undefined })"
          />
          <!-- Format hints -->
          <span v-if="element.format?.type" class="text--secondary fake-hint">
            <i18n v-if="element.format?.type === 'date'" path="hints.dateFormat" tag="span">
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
          </span>
        </v-card-text>
      </v-form>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Label } from '../forms/MetricsFigureForm.vue';

const formatTypes = [
  '',
  'date',
];

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    element: {
      type: Object as PropType<Label>,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    currentKeyFields: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (element: Label) => !!element,
  },
  data: () => ({
    innerDataKey: '',
    innerField: '',
    valid: false,
  }),
  computed: {
    rules() {
      return {
        dataKey: [
          (v: string) => v.length > 0 || this.$t('errors.empty'),
          !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
        field: [
          !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
      };
    },
    possibleFormatTypes() {
      return formatTypes.map((value) => ({
        text: this.$t(`formats.${value || '_other'}`),
        value,
      }));
    },
    currentKeyFieldsSet() {
      return new Set(this.currentKeyFields);
    },
    currentKeyField() {
      return `${this.element.dataKey}.${this.element.field || 'value'}`;
    },
    isDuplicate() {
      const kF = `${this.innerDataKey}.${this.innerField || 'value'}`;
      if (this.currentKeyField === kF) { return false; }

      return this.currentKeyFieldsSet.has(kF);
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
        this.$emit('updated', { ...this.element, ...data });
      }
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
    dataKey: 'Key to get data'
    field: 'Precise field'
    text: 'Text to show'
    type: 'Type of data'
    formatParams: 'Params to format data'
  errors:
    empty: 'This field must be set'
    no_duplicate: 'This couple Key/Field is already used'
  formats:
    _other: 'Other'
    date: 'Date'
  hints:
    dateFormat: 'Format of the date, based on {link}'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    field: 'Champ précis'
    text: 'Texte à afficher'
    type: 'Type de donnée'
    formatParams: 'Paramètre pour formatter les données'
  errors:
    empty: 'Ce champ doit être rempli'
    no_duplicate: 'Ce couple Clé/Champ est déjà utilisé'
  formats:
    _other: 'Autre'
    date: 'Date'
  hints:
    dateFormat: 'Format de la date, basé sur {link}'
</i18n>
