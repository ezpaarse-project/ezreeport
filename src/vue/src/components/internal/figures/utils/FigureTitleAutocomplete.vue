<template>
  <v-combobox
    :value="innerTitle"
    :items="possibleVars"
    :label="$t('title')"
    :return-object="false"
    no-filter
    dense
    hide-details
    ref="titleCB"
    class="pt-1"
    @input="onAutocompleteChoice"
    @update:search-input="innerTitle = $event"
    @blur="$emit('input', innerTitle)"
  >
    <template #item="{ item, on, attrs }">
      <v-list-item two-line v-bind="attrs" v-on="on">
        <v-list-item-content>
          <v-list-item-title>{{ item.value }}</v-list-item-title>
          <v-list-item-subtitle>{{ $t(`$ezreeport.figures.vars_list.${item.text}`) }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </template>

    <template #append>
      <div />
    </template>
  </v-combobox>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Possibles vars in title
 */
const templateVars = [
  'length',
];

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  emits: {
    input: (val: string) => !!val,
  },
  data: () => ({
    innerTitle: '',
  }),
  computed: {
    /**
     * Localized possible variables in title
     */
    possibleVars() {
      return templateVars.map((text) => ({
        value: `{{ ${text} }}`,
        text,
      })).sort(
        (a, b) => a.text.toString().localeCompare(b.text.toString()),
      );
    },
  },
  watch: {
    value() {
      this.innerTitle = this.value;
    },
  },
  mounted() {
    this.innerTitle = this.value;
  },
  methods: {
    async onAutocompleteChoice(choice: string) {
      if (choice) {
        const actual = this.innerTitle ?? '';
        await this.$nextTick();
        this.innerTitle = actual + choice;
        (this.$refs.titleCB as HTMLElement)?.focus();
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Title'
fr:
  title: 'Titre'
</i18n>
