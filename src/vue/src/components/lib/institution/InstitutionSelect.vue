<template>
  <div
    v-if="perms.read"
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
      @click="fetch(true)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { institutions } from 'ezreeport-sdk-js';

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
  },
  data: () => ({
    loading: false,
    error: '',
  }),
  computed: {
    defaultInstitution() {
      return this.$ezReeport.auth.user?.institution;
    },
    items(): InstitutionItem[] {
      const items = this.$ezReeport.institutions.data
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
      const perms = this.$ezReeport.auth.permissions;
      return {
        read: perms?.['institutions-get'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch institutions and parse result
     */
    async fetch(force = false) {
      this.loading = true;
      try {
        this.$ezReeport.institutions.fetch(force);
        // const {
        //   content: { default: def, available },
        // } = await this.$ezReeport.sdk.auth.getInstitutions();

        // this.institutions = available;
        // this.$emit('fetched', available);

        // this.defaultInstitution = def;
        // this.$emit('input', def ?? '');
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
    parseInstitution: (institution: institutions.Institution): InstitutionItem => ({
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
