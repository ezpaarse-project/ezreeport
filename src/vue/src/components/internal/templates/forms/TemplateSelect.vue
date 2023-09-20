<template>
  <div class="d-flex align-center">
    <div class="select-wrapper mr-2">
      <span style="transform: scale(0.75); font-size: 12px;">
        {{ label }}
      </span>

      <!-- Current Item -->
      <div
        v-if="current && !isInputShown"
        :class="['d-flex mb-6 current-item', $vuetify.theme.dark && 'current-item--dark']"
        tabindex="0"
        @click="openInput($event)"
        @keypress="() => {}"
        @focus="openInput(undefined)"
      >
        <v-list-item :class="disabled && 'text--secondary'">
          <v-list-item-content>
            <v-list-item-title>{{ current.name }}</v-list-item-title>
            <v-list-item-subtitle>
              <MiniTagsDetail :model-value="current.tags" :disabled="disabled" />
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-spacer />

        <v-icon>
          mdi-menu-down
        </v-icon>
      </div>

      <!-- Search box -->
      <v-autocomplete
        v-else
        :value="value"
        :items="autocompleteItems"
        :loading="loading"
        :disabled="disabled"
        item-text="name"
        item-value="id"
        menu-props="closeOnContentClick"
        outlined
        no-filter
        ref="input"
        @input="onTemplateSelected"
        @blur="isInputShown = false;"
        @update:search-input="innerSearch = $event"
      >
        <template #prepend-inner>
          <v-icon>
            mdi-magnify
          </v-icon>
        </template>

        <template #item="{ item, on, attrs }">
          <v-list-item v-bind="attrs" v-on="on">
            <v-list-item-content>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <MiniTagsDetail :model-value="item.tags" />
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-autocomplete>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import Fuse from 'fuse.js';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import useTemplateStore from '~/stores/template';

const fzfTemplates = new Fuse<templates.Template>(
  [],
  {
    keys: [
      { name: 'name', weight: 1 },
      { name: 'tags.name', weight: 0.5 },
    ],
    includeScore: true,
  },
);

export default defineComponent({
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  props: {
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    hideRefresh: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (value: string) => !!value,
  },
  data: () => ({
    loading: false,
    isInputShown: false,
    innerSearch: '',
  }),
  computed: {
    items(): templates.Template[] {
      return this.templateStore.available;
    },
    current() {
      return this.items.find(({ id }) => id === this.value) as (templates.Template | undefined);
    },
    searchResults() {
      if (!this.innerSearch) {
        return [];
      }
      return fzfTemplates.search(this.innerSearch);
    },
    autocompleteItems() {
      if (this.searchResults.length > 0) {
        return this.searchResults
          .filter(({ score }) => (score ?? 1) < 0.6)
          .map(({ item }) => item);
      }
      return this.items;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    items() {
      fzfTemplates.setCollection(this.items);
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch templates
     */
    async fetch() {
      this.loading = true;
      this.templateStore.refreshAvailableTemplates();
      this.loading = false;
    },
    /**
     * Open and focus input behind current item
     *
     * @param mouseEv The mouve event. If provided it will open the suggestions
     */
    async openInput(mouseEv?: MouseEvent) {
      if (this.disabled) {
        return;
      }

      // start refresh data
      const fetchPromise = this.fetch();

      this.isInputShown = true;
      await this.$nextTick();

      const input = (this.$refs.input as any);
      if (mouseEv) {
        input.onClick(mouseEv);
        return;
      }
      input.focus();

      await fetchPromise;
    },
    /**
     * Update value and hide input
     *
     * @param id The id of the template
     */
    onTemplateSelected(id?: string) {
      if (id == null) {
        return;
      }
      this.$emit('input', id);
      this.isInputShown = false;
    },
  },
});
</script>

<style scoped lang="scss">
.select-wrapper {
  position: relative;
  flex: 1;
}

.current-item {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  border: 1px solid rgba(0, 0, 0, 0.26);
  border-radius: 4px;

  &:hover {
    border-color: rgba(0, 0, 0, 0.87);
  }

  &--dark {
    border-color: rgba(255, 255, 255, 0.7);

    &:hover {
      border-color: #FFFFFF;
    }
  }
}
</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh template list'
fr:
  refresh-tooltip: 'Rafraîchir la liste des modèles'
</i18n>
