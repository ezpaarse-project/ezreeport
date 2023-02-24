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
        {{ $t(`title-${isReadonly ? 'read' : 'edit'}`) }}

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
                :label="$t('headers.key')"
                :value="element.key"
                :readonly="isReadonly"
                :rules="rules.key"
                @input="!isReadonly && $emit('update:element', { ...element, key: $event })"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-select
                :label="$t('headers.operator')"
                :value="element.operator"
                :items="operators"
                :rules="rules.operator"
                @input="updateOperator"
              />
            </v-col>

            <v-col>
              <v-select
                :label="$t('headers.modifier')"
                :value="element.modifier"
                :items="modifiers"
                :rules="rules.modifier"
                @input="updateModifier"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-combobox
                v-if="element.operator !== 'EXISTS'"
                :label="$t('headers.value')"
                :value="element.values"
                :rules="rules.value"
                multiple
                small-chips
                deletable-chips
                @input="updateValue"
              />
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

export interface QueryElement {
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
      type: Object as PropType<QueryElement>,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    'update:element': (el: QueryElement) => !!el,
  },
  data: () => ({
    valid: false,
  }),
  computed: {
    /**
     * If component is in readonly mode
     */
    isReadonly(): boolean {
      return !this.$listeners['update:element'];
    },
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
        ],
        operator: [
          (v: string) => operators.includes(v as any) || this.$t('errors.valid'),
        ],
        modifier: [
          (v: string) => modifiers.includes(v as any) || this.$t('errors.valid'),
        ],
        value: [
          (v: string[]) => v.length > 0 || this.$t('errors.empty'),
        ],
      };
    },
  },
  methods: {
    /**
     * Update element's values
     *
     * @param values The wanted values
     */
    updateValue(values: string[]) {
      if (this.isReadonly || !this.valid) {
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
      if (this.isReadonly || !this.valid) {
        return;
      }

      this.$emit('update:element', { ...this.element, modifier });
    },
    /**
     * Update element's operator
     *
     * @param operator The wanted operator
     */
    updateOperator(operator: Operators) {
      if (this.isReadonly || !this.valid) {
        return;
      }

      this.$emit('update:element', { ...this.element, operator });
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title-edit: 'Edit query element'
  title-read: 'Query element'
  headers:
    key: 'Field'
    operator: 'Operator'
    modifier: 'Modifier'
    value: 'Value'
  operators:
    IS: 'is'
    EXISTS: 'exist'
  modifiers:
    NOT: 'not'
  errors:
    empty: 'This field must be set'
    valid: 'The value must be valid'
fr:
  title-edit: "Éditer l'élément de requête"
  title-read: 'Élément de requête'
  headers:
    key: 'Champ'
    operator: 'Opérateur'
    modifier: 'Modificateur'
    value: 'Valeur'
  operators:
    IS: 'est'
    EXISTS: 'existe'
  modifiers:
    NOT: 'not' # TODO french trans
  errors:
    empty: 'Ce champ doit être rempli'
    valid: 'La valeur doit être valide'
</i18n>
