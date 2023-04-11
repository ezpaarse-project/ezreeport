<template>
  <v-dialog
    :value="value"
    :fullscreen="fullscreen"
    :transition="fullscreen ? 'ezr_dialog-right-transition' : undefined"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading" :tile="fullscreen">
      <v-card-title>
        <v-text-field
          v-if="item"
          v-model="item.name"
          :rules="rules.name"
          :label="$t('headers.name')"
        />

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
        <template v-if="item">
          <TagsForm v-model="item.tags" :availableTags="availableTags" />

          <TemplateForm :template.sync="item.body" />
        </template>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.create"
          :disabled="!item
            || !isNameValid
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
import { cloneDeep } from 'lodash';
import { defineComponent, type PropType } from 'vue';
import { type CustomTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';

type CustomCreateTemplate = Omit<templates.FullTemplate, 'body' | 'createdAt' | 'pageCount' | 'updatedAt' | 'renderer'> & { body: CustomTemplate };

const initItem = {
  name: '',
  body: { layouts: [] },
  tags: [],
} as CustomCreateTemplate;

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    availableTags: {
      type: Array as PropType<templates.FullTemplate['tags']>,
      default: () => [],
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    created: (template: templates.FullTemplate) => !!template,
  },
  data: () => ({
    item: undefined as CustomCreateTemplate | undefined,

    error: '',
    loading: false,
  }),
  watch: {
    value(val: boolean) {
      if (val) {
        this.item = cloneDeep(initItem);
      }
    },
  },
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        name: [
          (v: string) => !!v || this.$t('errors.empty'),
        ],
      };
    },
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readOne: has('templates-get-name(*)'),
        create: has('templates-post'),
      };
    },
    /**
     * name field is outside of the v-form, so we need to manually check using rules
     */
    isNameValid() {
      return this.rules.name.every((rule) => rule(this.item?.name ?? '') === true);
    },
    /**
     * Is template valid
     */
    templateValidation(): boolean {
      if (!this.item || !this.item.body) {
        return true;
      }

      return !this.item.body.layouts.find(({ _: { valid } }) => valid !== true);
    },
  },
  methods: {
    /**
     * Save and create template
     */
    async save() {
      if (!this.item || !this.isNameValid || this.templateValidation !== true) {
        return;
      }

      if (!this.item.name || !this.perms.create) {
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

        const { content } = await this.$ezReeport.sdk.templates.createTemplate(
          {
            name: this.item.name,
            body: {
              ...this.item.body,
              layouts,
            },
            tags: this.item.tags ?? [],
          },
        );

        this.$emit('created', content);
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
    name: 'Name of template'
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
