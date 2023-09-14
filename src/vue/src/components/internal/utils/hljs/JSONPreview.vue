<template>
  <HLjs language="json" :code="json" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: [] as PropType<any>,
      required: true,
    },
  },
  computed: {
    json() {
      return JSON.stringify(this.value, undefined, 2);
    },
  },
});
</script>

<style scoped>

</style>
