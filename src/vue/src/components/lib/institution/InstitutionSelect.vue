<template>
  <div
    v-if="perms.readInstitutions"
    class="d-flex align-center"
  >
    <div class="select-wrapper mr-2">
      <v-select
        ref="menu"
        :value="value"
        item-text="name"
        item-value="id"
        :items="items"
        :loading="loading"
        :disabled="loading || !!error"
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
          <InstitutionRichListItem
            v-else
            :institution="item"
          />
        </template>

        <template #item="{ item, on, attrs }">
          <RichListItem
            v-if="!item.id"
            :title="item.name"
            fallback-icon="mdi-filter-variant"
          />
          <InstitutionRichListItem
            v-else
            :institution="item"
            v-bind="attrs"
            v-on="on"
          />
        </template>
      </v-select>

      <ErrorOverlay :error="error" />
    </div>

    <RefreshButton
      :loading="loading"
      :tooltip="$t('refresh-tooltip').toString()"
      @click="fetch"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { auth } from 'ezreeport-sdk-js';

export interface InstitutionItem {
  id: string,
  name: string,
  city?: string,
  logoId?: string,
  acronym?: string,
}

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  emits: {
    input(value: string) {
      return !value || typeof value === 'string';
    },
    fetched(value: auth.Institution[]) {
      return Array.isArray(value);
    },
  },
  data: () => ({
    institutions: [] as auth.Institution[],
    defaultInstitution: undefined as string | undefined,
    loading: false,
    error: '',
  }),
  computed: {
    items(): InstitutionItem[] {
      const items = this.institutions
        .map(this.parseInstitution)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!this.defaultInstitution) {
        // Only SUPER_USERS don't have default institution
        return [
          { id: '', name: this.$t('all').toString() },
          ...items,
        ];
      }
      return [
        ...items,
      ];
      // return items;
    },
    perms() {
      const perms = this.$ezReeport.auth_permissions;
      return {
        readInstitutions: perms?.['auth-get-institutions'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth_permissions': function () {
      if (this.perms.readInstitutions) {
        this.fetch();
      } else {
        this.institutions = [];
      }
    },
  },
  methods: {
    /**
     * Fetch institutions and parse result
     */
    async fetch() {
      this.loading = true;
      try {
        const {
          content: { default: def, available },
        } = await this.$ezReeport.auth.getInstitutions();

        this.institutions = available;
        this.$emit('fetched', available);

        this.defaultInstitution = def;
        this.$emit('input', def ?? '');
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     *
     * Parse institution into human readable format
     *
     * @param institution The institution
     */
    parseInstitution: (institution: auth.Institution): InstitutionItem => ({
      id: institution.id,
      name: institution.name,
      logoId: institution.logoId,
      acronym: institution.acronym,
      city: institution.city,
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
messages:
  en:
    all: "All institutions"
    refresh-tooltip: "Refresh institution list"
  fr:
    all: "Tous les établissements"
    refresh-tooltip: "Rafraîchir la liste des établissements"
</i18n>
