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
      const perms = this.$ezReeport.auth.permissions;
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
    '$ezReeport.auth.permissions': function () {
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
fr:
  title: 'Modèles'
  refresh-tooltip: 'Rafraîchir la liste des modèles'
</i18n>
