<template>
  <v-dialog :value="value" :fullscreen="fullscreen" scrollable @input="$emit('input', $event)">
    <v-card :loading="loading" :tile="fullscreen">
      <v-card-title>
        <template v-if="item">
          {{ item.name }}
        </template>

        <v-spacer />

        <RefreshButton
          :loading="loading"
          :tooltip="$t('refresh-tooltip').toString()"
          @click="fetch"
        />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
        <TemplateForm v-if="item?.body" :template.sync="item.body" />

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          :disabled="!item
            || templateValidation !== true"
          :loading="loading"
          color="success"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import {
  addAdditionalDataToLayouts,
  type CustomTemplate,
} from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';

type CustomFullTemplate = Omit<templates.FullTemplate, 'body'> & { body: CustomTemplate };

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (template: templates.FullTemplate) => !!template,
  },
  data: () => ({
    item: undefined as CustomFullTemplate | undefined,

    error: '',
    loading: false,
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readOne: has('templates-get-name(*)'),
        update: has('templates-put-name(*)'),
      };
    },
    /**
     * Is template valid
     */
    templateValidation(): boolean /* true | string */ {
      if (!this.item || !this.item.body) {
        return true;
      }

      return !this.item.body.layouts.find(({ _: { valid } }) => valid !== true);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    name() {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch template
     */
    async fetch() {
      if (!this.perms.readOne) {
        this.item = undefined;
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.name);
        if (!content) {
          throw new Error(this.$t('errors.no_data').toString());
        }

        // Add additional data
        content.body.layouts = addAdditionalDataToLayouts(content.body.layouts ?? []);

        this.item = content as CustomFullTemplate;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Save and edit template
     */
    async save() {
      if (!this.item || this.templateValidation !== true) {
        return;
      }

      if (!this.name || !this.perms.update) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        // Remove frontend data from payload
        const layouts = this.item.body.layouts?.map(
          ({ _, ...insert }) => ({
            ...insert,
            // eslint-disable-next-line @typescript-eslint/no-shadow
            figures: insert.figures.map(({ _, ...figure }) => figure),
          }),
        );

        const { content } = await this.$ezReeport.sdk.templates.updateTemplate(
          this.item.name,
          {
            body: {
              ...this.item.body,
              layouts,
            },
          },
        );

        this.$emit('updated', content);
        this.$emit('input', false);
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh template'
  headers:
    name: 'Template name'
  errors:
    empty: 'This field must be set'
    no_data: 'An error occurred when fetching data'
  actions:
    cancel: 'Cancel'
    save: 'Save'
fr:
  refresh-tooltip: 'Rafraîchir le modèle'
  headers:
    name: 'Nom du modèle'
  errors:
    empty: 'Ce champ doit être rempli'
    no_data: 'Une erreur est survenue lors de la récupération des données'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
