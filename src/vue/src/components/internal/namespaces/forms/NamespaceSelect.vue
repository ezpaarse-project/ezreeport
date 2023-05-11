<template>
  <div class="d-flex align-center">
    <div class="select-wrapper mr-2">
      <v-select
        ref="menu"
        :value="value"
        item-text="name"
        item-value="id"
        :items="items"
        :loading="loading"
        :disabled="loading || !!error"
        :error-messages="errorMessage"
        menu-props="closeOnContentClick"
        class="select-input"
        @input="$emit('input', $event)"
      >
        <template #selection="{ item }">
          <RichListItem
            v-if="!item.id"
            :title="item.name"
            fallback-icon="mdi-filter-variant"
          />
          <NamespaceRichListItem
            v-else
            :namespace="item"
          />
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
            v-bind="attrs"
            v-on="on"
          />
        </template>
      </v-select>

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
import type { namespaces } from '@ezpaarse-project/ezreeport-sdk-js';
import ezReeportMixin from '~/mixins/ezr';

export interface NamespaceItem {
  id: string,
  name: string,
  logoId?: string,
}

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
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
  },
  emits: {
    input: (value: string) => !!value,
  },
  data: () => ({
    loading: false,
    error: '',
  }),
  computed: {
    items(): NamespaceItem[] {
      const items = this.$ezReeport.data.namespaces.data
        .filter((namespace) => {
          if (this.neededPermissions.length <= 0) {
            return true;
          }

          return this.neededPermissions.every(
            (perm) => this.$ezReeport.data.auth.permissions?.namespaces[namespace.id]?.[perm],
          );
        })
        .map(this.parseNamespace)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (this.hideAll) {
        return items;
      }

      return [
        { id: '', name: this.$t('all', { namespace: this.$ezReeport.tcNamespace(false, 2) }).toString() },
        ...items,
      ];
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
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
     *
     * Parse namespace into human readable format
     *
     * @param namespace The namespace
     */
    parseNamespace: (namespace: namespaces.Namespace): NamespaceItem => ({
      id: namespace.id,
      name: namespace.name,
      logoId: namespace.logoId,
    }),
  },
});
</script>

<style scoped lang="scss">
.select-wrapper {
  position: relative;
  flex: 1;

  .select-input::v-deep .v-input__append-inner {
    align-self: unset;
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
