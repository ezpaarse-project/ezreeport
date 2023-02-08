<template>
  <li>
    <v-btn v-if="isObject || isArray" icon @click="collapsed = !collapsed" x-small class="collapse-btn">
      <v-icon>mdi-chevron-{{ collapsed === false ? 'up' : 'down' }}</v-icon>
    </v-btn>

    <div class="d-flex align-end">
      <span class="label" @click="openPropertyDialog" @keydown="openPropertyDialog">
        {{ property }}:
      </span>

      <div class="ml-1" style="flex: 1">
        <template v-if="isBoolean || isNumber || isString">
          <v-switch
            v-if="isBoolean"
            :input-value="value"
            :readonly="!$listeners.input"
            dense
            hide-details
            class="mt-0"
            @change="$emit('input', property, $event)"
          />

          <v-text-field
            v-else-if="isNumber || isString"
            :type="isNumber ? 'number' : 'text'"
            :value="value"
            :readonly="!$listeners.input"
            :placeholder="$t('value')"
            dense
            hide-details
            @blur="onValueUpdate"
          />
        </template>

        <div v-else class="font-italic text--disabled">
          {{ value.constructor.name }}

          <v-btn icon color="success" x-small @click="addField">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <ObjectTree
      v-if="!collapsed && (isObject || isArray)"
      :value="value"
      :dialog-ref="dialogRef"
      @input="$emit('input', property, $event)"
    />
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  name: 'ObjectTreeItem',
  props: {
    property: {
      type: [String, Number],
      required: true,
    },
    value: {
      type: [] as PropType<any>,
      required: true,
    },
    dialogRef: {
      type: Object,
      default: undefined,
    },
  },
  emits: {
    input: (key: string | number, value: any) => !!key && !!value,
    delete: () => true,
  },
  data: () => ({
    collapsed: true,
  }),
  computed: {
    /**
     * The entries of the object/array
     */
    entries() {
      return Object
        .entries(this.value)
        .filter(([, value]) => value !== undefined && value !== null);
    },
    /**
     * Is the value null ?
     */
    isNull() {
      return this.value === undefined || this.value === null;
    },
    /**
     * Is the value an array ?
     */
    isArray() {
      return !this.isNull && Array.isArray(this.value);
    },
    /**
     * Is the value an object (but not an array) ?
     */
    isObject() {
      return !this.isNull && !this.isArray && typeof this.value === 'object';
    },
    /**
     * Is the value a number ?
     */
    isNumber() {
      return !this.isNull && typeof this.value === 'number';
    },
    /**
     * Is the value a boolean ?
     */
    isBoolean() {
      return !this.isNull && typeof this.value === 'boolean';
    },
    /**
     * Is the value a string ?
     */
    isString() {
      return !this.isNull && typeof this.value === 'string';
    },
  },
  methods: {
    /**
     * Open advanced edition dialog
     */
    openPropertyDialog() {
      this.dialogRef?.close();
      this.dialogRef?.open(this);
    },
    /**
     * When value is updated (used to trigger on blur and avoid too many updates)
     *
     * @param e The event
     */
    onValueUpdate(e: Event) {
      const { value } = e.target as HTMLInputElement;
      if (value !== this.value) {
        this.$emit('input', this.property, value);
      }
    },
    /**
     * Add a new field to the object/array
     */
    addField() {
      if (typeof this.value !== 'object') {
        return;
      }

      this.collapsed = false;
      if (Array.isArray(this.value)) {
        // Creating value based on previous type
        const val = this.value.at(-1)?.constructor() ?? '';
        this.$emit('input', this.property, [...this.value, val]);
      } else {
        const index = Object.keys(this.value).length;
        this.$emit('input', this.property, { ...this.value, [`key-${index}`]: '' });
      }
    },
  },
});
</script>

<style scoped lang="scss">
.label {
  text-decoration: underline dotted;
  font-style: italic;
  cursor: pointer;
}

.collapse-btn {
  margin-left: 4px;
  align-self: center;
  position: absolute;
  left: -1.75rem;
}
</style>

<i18n lang="yaml">
en:
  value: 'Value'
fr:
  value: 'Valeur'
</i18n>
