<template>
  <ul class="list">
    <ObjectTreeItem v-for="[key, val] in entries" :key="key" :property="key" :value="val" />
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
  },
  computed: {
    entries() {
      return Object
        .entries(this.value)
        .filter(([, value]) => value !== undefined && value !== null);
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
