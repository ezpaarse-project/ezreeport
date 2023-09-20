<template>
  <div class="d-flex align-center">
    <div class="select-wrapper mr-2">
      <!-- Current Item -->
      <div
        v-if="current && !isInputShown"
        :class="['d-flex mb-5 current-item', $vuetify.theme.dark && 'current-item--dark']"
        tabindex="0"
        @click="openInput($event)"
        @keypress="() => {}"
        @focus="openInput(undefined)"
      >
        <RichListItem
          v-if="!current.id"
          :title="current.name"
          fallback-icon="mdi-filter-variant"
        />
        <NamespaceRichListItem
          v-else
          :namespace="current"
        />

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
        :disabled="loading || !!error"
        :error-messages="errorMessage"
        item-text="name"
        item-value="id"
        menu-props="closeOnContentClick"
        no-filter
        ref="input"
        class="select-input"
        @input="onNamespaceSelected"
        @blur="isInputShown = false;"
        @update:search-input="innerSearch = $event"
      >
        <template #prepend-inner>
          <v-icon>
            mdi-magnify
          </v-icon>
        </template>

        <template #item="{ item, on, attrs }">
          <RichListItem
            v-if="!item.id"
            :title="item.name"
            fallback-icon="mdi-filter-variant"
          />
          <NamespaceRichListItem
            v-else
            :namespace="item"
            :show-task-count="showTaskCount"
            :show-members-count="showMembersCount"
            v-bind="attrs"
            v-on="on"
          />
        </template>
      </v-autocomplete>

      <ErrorOverlay v-model="error" />
    </div>

    <RefreshButton
      v-if="!hideRefresh"
      :loading="loading"
      :tooltip="$t('refresh-tooltip', { namespace: $ezReeport.tcNamespace() }).toString()"
      @click="fetch(true)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import Fuse from 'fuse.js';
import type { namespaces } from '@ezpaarse-project/ezreeport-sdk-js';
import ezReeportMixin from '~/mixins/ezr';

const fzfNamespaces = new Fuse<namespaces.Namespace>(
  [],
  {
    keys: ['name'],
    includeScore: true,
  },
);

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    neededPermissions: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    hideAll: {
      type: Boolean,
      default: false,
    },
    hideRefresh: {
      type: Boolean,
      default: false,
    },
    /**
     * Allowed namespaces
     */
    allowedNamespaces: {
      type: Array as PropType<string[] | undefined>,
      default: undefined,
    },
    showTaskCount: {
      type: Boolean,
      default: false,
    },
    showMembersCount: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (value: string) => !!value,
  },
  data: () => ({
    loading: false,
    error: '',
    isInputShown: false,
    innerSearch: '',
  }),
  computed: {
    baseItems() {
      const baseItems = [];
      if (!this.hideAll) {
        baseItems.push(
          {
            id: '',
            name: this.$t(
              'all',
              { namespace: this.$ezReeport.tcNamespace(false, 2) },
            ).toString(),
          } as namespaces.Namespace,
        );
      }

      return baseItems;
    },
    items(): namespaces.Namespace[] {
      let items = this.$ezReeport.data.namespaces.data;

      if (this.allowedNamespaces && Array.isArray(this.allowedNamespaces)) {
        const allowedSet = new Set(this.allowedNamespaces);
        items = items.filter((namespace) => allowedSet.has(namespace.id));
      }

      if (Array.isArray(this.neededPermissions) && this.neededPermissions.length >= 0) {
        items = items.filter((namespace) => this.neededPermissions.every(
          (perm) => this.$ezReeport.data.auth.permissions?.namespaces[namespace.id]?.[perm],
        ));
      }

      items.sort((a, b) => a.name.localeCompare(b.name));

      return items;
    },
    current() {
      return [...this.baseItems, ...this.items].find(({ id }) => id === this.value);
    },
    searchResults() {
      if (!this.innerSearch) {
        return [];
      }
      return fzfNamespaces.search(this.innerSearch);
    },
    autocompleteItems() {
      if (this.searchResults.length <= 0) {
        return [...this.baseItems, ...this.items];
      }

      const results = this.searchResults
        .filter(({ score }) => (score ?? 1) < 0.6)
        .map(({ item }) => item);

      return [...this.baseItems, ...results];
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    items() {
      fzfNamespaces.setCollection(this.items);
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch namespaces and parse result
     */
    async fetch(force = false) {
      this.loading = true;
      try {
        this.$ezReeport.fetchNamespaces(force);
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Open and focus input behind current item
     *
     * @param mouseEv The mouve event. If provided it will open the suggestions
     */
    async openInput(mouseEv?: MouseEvent) {
      this.isInputShown = true;
      await this.$nextTick();

      const input = (this.$refs.input as any);
      if (mouseEv) {
        input.onClick(mouseEv);
        return;
      }
      input.focus();
    },
    /**
     * Update value and hide input
     *
     * @param id The id of the namespace
     */
    onNamespaceSelected(id?: string) {
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

  .select-input::v-deep {
    .v-input__slot {
      min-height: 56px;
      align-items: center;
    }
    .v-input__prepend-inner {
      align-self: center;
      margin-top: 0;
    }
  }
}

.current-item {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);

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
  all: 'All {namespace}'
  refresh-tooltip: 'Refresh {namespace} list'
fr:
  all: 'Tous les {namespace}'
  refresh-tooltip: 'Rafraîchir la liste des {namespace}s'
</i18n>
