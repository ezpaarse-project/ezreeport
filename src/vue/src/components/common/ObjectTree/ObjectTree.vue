<template>
  <ul class="list">
    <ObjectTreeItem
      v-for="[key, val] in entries"
      :key="key"
      :property="key"
      :value="val"
      :dialog-ref="dialogRef"
      @input="(k, v) => onUpdate(key, k, v)"
      @delete="onDelete(key)"
    />
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ObjectTree',
  props: {
    value: {
      type: [Object, Array],
      required: true,
    },
    dialogRef: {
      type: Object,
      default: undefined,
    },
  },
  emits: {
    input: (v: Record<string, any> | unknown[]) => !!v,
  },
  computed: {
    /**
     * The entries of the object/array
     */
    entries() {
      return Object
        .entries(this.value)
        .filter(([, value]) => value !== undefined && value !== null);
    },
  },
  methods: {
    /**
     * When a field of the tree is updated
     *
     * @param oldKey The old key
     * @param key The new key (can be the same as old one)
     * @param val The new value
     */
    onUpdate(oldKey: string | number, key: string | number, val: any) {
      let value;
      if (Array.isArray(this.value)) {
        value = [...this.value];

        if (oldKey !== key) {
          value.splice(oldKey as number, 1);
        }
        value.splice(key as number, +(oldKey === key), val);
      } else {
        value = { ...this.value };
        if (oldKey !== key) {
          delete value[oldKey];
        }
        value[key] = val;
      }
      this.$emit('input', value);
    },
    /**
     * When a children field is deleted
     */
    onDelete(key: string | number) {
      let value;
      if (Array.isArray(this.value)) {
        value = [...this.value];
        value.splice(key as number, 1);
      } else {
        value = { ...this.value };
        delete value[key];
      }
      this.$emit('input', value);
    },
  },
});
</script>

<style scoped lang="scss">
.list {
  margin-left: 1rem;
  list-style-type: none;

  & > li {
    position: relative;
  }
}
</style>
