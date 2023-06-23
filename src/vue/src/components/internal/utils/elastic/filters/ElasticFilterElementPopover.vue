<template>
  <v-menu
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    :close-on-click="valid"
    absolute
    offset-y
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        {{ $t(`title-${readonly ? 'read' : 'edit'}`) }}

        <v-spacer />

        <v-btn :disabled="!valid" icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <v-text-field
                v-model="innerKey"
                :label="$t('headers.key')"
                :readonly="readonly"
                :rules="rules.key"
                hide-details="auto"
                @blur="updateKey"
              />
              <i18n path="hints.dot_notation.value" tag="span" class="text--secondary fake-hint">
                <template #code>
                  <code>{{ $t('hints.dot_notation.code') }}</code>
                </template>
              </i18n>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-select
                :label="$t('headers.operator')"
                v-model="innerOperator"
                :readonly="readonly"
                :items="operators"
                :rules="rules.operator"
                @input="updateOperator"
              />
            </v-col>

            <v-col>
              <v-checkbox
                :label="$t('headers.modifier')"
                :value="element.modifier === 'NOT'"
                :readonly="readonly"
                :rules="rules.modifier"
                @change="updateModifier($event ? 'NOT' : '')"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-combobox
                v-if="element.operator !== 'EXISTS'"
                :label="$t('headers.value')"
                :value="element.values"
                :readonly="readonly"
                :deletable-chips="element.values.length > 1"
                :rules="rules.value"
                multiple
                small-chips
                @input="updateValue"
              >
                <template #append>
                  <div />
                </template>
              </v-combobox>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

const modifiers = ['', 'NOT'] as const;
const operators = ['IS', 'EXISTS'] as const;

type Modifiers = typeof modifiers[number];
type Operators = typeof operators[number];

export interface FilterElement {
  raw: string;
  modifier: Modifiers;
  operator: Operators;
  key: string;
  values: (string | number | boolean)[]
}

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    element: {
      type: Object as PropType<FilterElement>,
      required: true,
    },
    usedRaws: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      required: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    'update:element': (el: FilterElement) => !!el,
  },
  data: () => ({
    valid: false,

    innerKey: '',
    innerOperator: '' as Operators,
  }),
  watch: {
    value() {
      if (this.value) {
        this.innerKey = this.element.key;
        this.innerOperator = this.element.operator;
      }
    },
    element() {
      if (this.value) {
        this.innerKey = this.element.key;
        this.innerOperator = this.element.operator;
      }
    },
  },
  computed: {
    /**
     * Possible modifiers
     */
    modifiers(): { text: string, value: Modifiers }[] {
      return modifiers.map((m) => ({
        text: m && this.$t(`modifiers.${m}`).toString(),
        value: m,
      }));
    },
    /**
     * Possible operators
     */
    operators(): { text: string, value: Operators }[] {
      return operators.map((o) => ({
        text: this.$t(`operators.${o}`).toString(),
        value: o,
      }));
    },
    /**
     * Validation rules
     */
    rules() {
      return {
        key: [
          (v: string) => !!v || this.$t('errors.empty'),
          () => !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
        operator: [
          (v: string) => operators.includes(v as any) || this.$t('errors.valid'),
          () => !this.isDuplicate || this.$t('errors.no_duplicate'),
        ],
        modifier: [],
        value: [
          (v: string[]) => v.length > 0 || this.$t('errors.empty'),
        ],
      };
    },
    usedRawsSet() {
      return new Set(this.usedRaws);
    },
    isDuplicate() {
      const raw = `${this.innerKey}.${this.innerOperator}`;
      if (this.element.raw === raw) { return false; }

      return this.usedRawsSet.has(raw);
    },
  },
  methods: {
    /**
     * Update element's key
     */
    updateKey() {
      if (this.readonly || !this.valid) {
        return;
      }

      this.$emit('update:element', {
        ...this.element,
        key: this.innerKey,
        operator: this.innerOperator,
      });
    },
    /**
     * Update element's values
     *
     * @param values The wanted values
     */
    updateValue(values: string[]) {
      if (this.readonly || !this.valid) {
        return;
      }

      this.$emit('update:element', { ...this.element, values });
    },
    /**
     * Update element's modifier
     *
     * @param modifier The wanted modifier
     */
    updateModifier(modifier: Modifiers) {
      if (this.readonly || !this.valid) {
        return;
      }

      this.$emit('update:element', { ...this.element, modifier });
    },
    /**
     * Update element's operator
     */
    async updateOperator() {
      await this.$nextTick();
      if (this.readonly || !this.valid || this.isDuplicate) {
        return;
      }

      this.$emit('update:element', {
        ...this.element,
        key: this.innerKey,
        operator: this.innerOperator,
        values: this.innerOperator === 'EXISTS' ? [] : ['value'],
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
  title-edit: 'Edit query element'
  title-read: 'Query element'
  hints:
    dot_notation:
      value: 'Support dot notation. Eg: {code}'
      code: 'key.value'
  headers:
    key: 'Field'
    operator: 'Operator'
    modifier: 'Reverse ?'
    value: 'Value'
  operators:
    IS: 'is'
    EXISTS: 'exist'
  modifiers:
    NOT: 'not'
  errors:
    empty: 'This field must be set'
    valid: 'The value must be valid'
    no_duplicate: 'This filter already exist or conflicts with another one'
fr:
  title-edit: "Éditer l'élément de requête"
  title-read: 'Élément de requête'
  hints:
    dot_notation:
      value: 'Supporte la notation avec des points. Ex: {code}'
      code: 'cle.valeur'
  headers:
    key: 'Champ'
    operator: 'Opérateur'
    modifier: 'Inverser ?'
    value: 'Valeur'
  operators:
    IS: 'est'
    EXISTS: 'existe'
  modifiers:
    NOT: 'non'
  errors:
    empty: 'Ce champ doit être rempli'
    valid: 'La valeur doit être valide'
    no_duplicate: 'Ce filtre existe déjà ou est incompatible avec un autre'
</i18n>
