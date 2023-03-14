<template>
  <v-col v-if="perms.readAll">
    <TemplateDialogRead
      v-if="perms.readOne && focusedName"
      v-model="readTemplateDialogShown"
      :name="focusedName"
      fullscreen
    />

    <LoadingToolbar
      :text="$t('title').toString()"
      :loading="loading"
    >
      <RefreshButton
        :loading="loading"
        :tooltip="$t('refresh-tooltip').toString()"
        @click="fetch"
      />
    </LoadingToolbar>

    <v-divider />

    <v-list style="position: relative;">
      <v-list-item
        v-for="template in items"
        :key="template.name"
        @click="openReadDialog(template)"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ template.name }}</div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <ErrorOverlay v-model="error" />
    </v-list>
  </v-col>
</template>

<script lang="ts">
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';

export default defineComponent({
  inject: ['$ezReeport'],
  data: () => ({
    readTemplateDialogShown: false,

    focusedName: '',
    templates: [] as templates.Template[],

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const perms = this.$ezReeport.data.auth.permissions;
      return {
        readAll: perms?.['templates-get'],
        readOne: perms?.['templates-get-name(*)'],
      };
    },
    /**
     * List items
     */
    items() {
      return this.templates;
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
     * Fetch all possible templates
     */
    async fetch() {
      if (!this.perms.readAll) {
        this.templates = [];
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getAllTemplates();
        if (!content) {
          throw new Error(this.$t('errors.no_data').toString());
        }

        this.templates = content;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Prepare and open read dialog
     */
    openReadDialog(item: templates.Template) {
      this.focusedName = item.name;
      this.readTemplateDialogShown = true;
    },
  },
});
</script>

<style lang="scss" scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Templates'
  refresh-tooltip: 'Refresh template list'
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  title: 'Modèles'
  refresh-tooltip: 'Rafraîchir la liste des modèles'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
