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
          <i18n v-if="valid" path="hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
            <template #code>
              <code>{{ $t('hints.dot_notation.code') }}</code>
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
          <CustomSection>
            <ToggleableObjectTree
              :label="$t('headers.advanced').toString()"
              v-model="unsupportedParams"
            />
          </CustomSection>
        </v-card-text>
      </v-form>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { merge, omit } from 'lodash';
import type { TableColumn } from '../forms/TablePreviewForm.vue';

const supportedKeys = [
  '_',
  'header',
  'dataKey',
];

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    column: {
      type: Object as PropType<TableColumn>,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    currentDataKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
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
    currentDataKeySet() {
      return new Set(this.currentDataKeys);
    },
    isDuplicate() {
      if (this.column.dataKey === this.innerDataKey) { return false; }

      return this.currentDataKeySet.has(this.innerDataKey);
    },
    rules() {
      return {
        dataKey: [
          (v: string) => v.length > 0 || this.$t('errors.empty'),
          !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
        header: [
          (v: string) => v.length > 0 || this.$t('errors.empty'),
        ],
      };
    },
    unsupportedParams: {
      get(): Record<string, any> {
        return omit(this.column, supportedKeys);
      },
      set(val: Record<string, any>) {
        this.$emit('input', merge(this.value, val));
      },
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
    advanced: 'Advanced parameters'
  hints:
    dot_notation:
      value: 'Support dot notation. Eg: {code}'
      code: 'key.value'
  errors:
    empty: 'This field must be set'
    no_duplicate: 'This key is already used'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    header: 'Name of the column'
    advanced: 'Paramètres avancés'
  hints:
    dot_notation:
      value: 'Supporte la notation avec des points. Ex: {code}'
      code: 'cle.valeur'
  errors:
    empty: 'Ce champ doit être rempli'
    no_duplicate: 'Cette clé est déjà utilisé'
</i18n>
