<template>
  <div>
    <ReadableChip
      v-for="tag in tagChips"
      :key="tag.name"
      :color="tag.color"
      x-small
      class="mr-2"
      style="pointer-events: none;"
    >
      {{ tag.name }}
    </ReadableChip>

    <v-tooltip v-if="tagsTooltip" top>
      <template #activator="{ attrs, on }">
        <v-icon v-bind="attrs" v-on="on" small>mdi-dots-horizontal</v-icon>
      </template>

      <span>{{ tagsTooltip }}</span>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from '~/lib/templates/tags';

const MAX_TAGS_SHOWN = 4;

const props = defineProps<{
  modelValue: Tag[],
}>();

const tagChips = computed(() => props.modelValue.slice(0, MAX_TAGS_SHOWN));

const tagsTooltip = computed(() => {
  if (props.modelValue.length <= MAX_TAGS_SHOWN) {
    return undefined;
  }
  return props.modelValue.slice(MAX_TAGS_SHOWN).map((t) => t.name).join(', ');
});
</script>

<style scoped>

</style>
