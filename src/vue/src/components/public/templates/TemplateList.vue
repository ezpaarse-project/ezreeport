<template>
  <v-col v-if="perms.readAll">
    <TemplateDialogRead
      v-if="perms.readOne && focusedName"
      v-model="readTemplateDialogShown"
      :name="focusedName"
      fullscreen
    />

    <TemplateDialogUpdate
      v-if="perms.update && focusedName"
      v-model="updateTemplateDialogShown"
      :name="focusedName"
      fullscreen
      @updated="onTemplateEdited"
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
        @click="showTemplateDialog(template)"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ template.name }}</div>

            <v-spacer />

            <v-tooltip v-if="perms.update">
              <template #activator="{ attrs, on }">
                <v-btn icon color="info" @click.stop="showEditDialog(template)" v-on="on" v-bind="attrs">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('actions.edit') }}</span>
            </v-tooltip>
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
import ezReeportMixin from '~/mixins/ezr';

export default defineComponent({
  mixins: [ezReeportMixin],
  data: () => ({
    readTemplateDialogShown: false,
    updateTemplateDialogShown: false,

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
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readAll: has('templates-get'),
        readOne: has('templates-get-name(*)'),
        update: has('templates-put-name(*)'),
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
     * Called when a template is edited by a dialog
     */
    onTemplateEdited(template: templates.Template) {
      const index = this.items.findIndex((t) => t.name === template.name);
      if (index < 0) {
        return;
      }

      const items = [...this.items];
      items.splice(index, 1, { ...template });
      this.items = items;
    },
    /**
     * Prepare and open read dialog
     */
    showTemplateDialog({ name }: templates.Template) {
      this.focusedName = name;
      this.readTemplateDialogShown = true;
    },
    /**
     * Prepare and show template edition dialog
     *
     * @param item The item
     */
    showEditDialog({ name }: templates.Template) {
      this.focusedName = name;
      this.updateTemplateDialogShown = true;
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
