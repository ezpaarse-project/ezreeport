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
          v-if="data"
          v-model="data.name"
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
          v-if="perms.create"
          :disabled="!data || !valid || templateStore.isCurrentValid !== true"
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

type CustomCreateTemplate = Omit<templates.FullTemplate, 'body' | 'createdAt' | 'pageCount' | 'updatedAt' | 'renderer'>;

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
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    data: undefined as CustomCreateTemplate | undefined,

    error: '',
    loading: false,
  }),
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
     * Name validation, which is outside of form
     */
    valid() {
      return this.rules.name.every((rule) => rule(this.data?.name ?? '') === true);
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.init();
      } else {
        this.templateStore.SET_CURRENT(undefined);
      }
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.templateStore.SET_CURRENT({ layouts: [] });
      this.data = {
        name: '',
        tags: [],
      };
    },
    /**
     * Save and create template
     */
    async save() {
      if (!this.data || !this.valid || this.templateStore.isCurrentValid !== true) {
        return;
      }

      if (!this.data.name || !this.perms.create) {
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
            tags: this.data?.tags ?? [],
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
  actions:
    cancel: 'Cancel'
    save: 'Save'
fr:
  refresh-tooltip: 'Rafraîchir le modèle'
  headers:
    name: 'Nom du modèle'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
</i18n>
