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
        <template v-if="data">
          {{ data.name }}
        </template>

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
        <template v-if="data">
          <TagsForm v-model="data.tags" :availableTags="availableTags" />

          <TemplateForm />
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
          v-if="perms.update"
          :disabled="!data || templateStore.isCurrentValid !== true"
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
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isFullTemplate } from '~/stores/template';

type BodyLessFullTemplate = Omit<templates.FullTemplate, 'body'>;

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
    availableTags: {
      type: Array as PropType<templates.FullTemplate['tags']>,
      default: () => [],
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (template: templates.FullTemplate) => !!template,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    data: undefined as BodyLessFullTemplate | undefined,

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
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    value(val: boolean) {
      if (val) {
        this.fetch();
      } else {
        this.templateStore.SET_CURRENT(undefined);
      }
    },
  },
  methods: {
    /**
     * Fetch template
     */
    async fetch() {
      if (!this.perms.readOne) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.name);
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        const { body, ...data } = content;
        this.templateStore.SET_CURRENT(body);
        this.data = data;

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
      if (!this.data || this.templateStore.isCurrentValid !== true) {
        return;
      }

      if (!this.name || !this.perms.update) {
        this.$emit('input', false);
        return;
      }

      const body = this.templateStore.GET_CURRENT();
      if (!body || !isFullTemplate(body)) {
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.upsertTemplate(
          this.data.name,
          {
            body,
            tags: this.data.tags ?? [],
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
    no_data: 'An error occurred when fetching data'
  actions:
    cancel: 'Cancel'
    save: 'Save'
fr:
  refresh-tooltip: 'Rafraîchir le modèle'
  headers:
    name: 'Nom du modèle'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
