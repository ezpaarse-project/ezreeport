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
        <v-skeleton-loader v-if="!data" type="card-heading" width="500" />
        <v-text-field
          v-else
          v-model="data.name"
          :rules="rules.name"
          :label="$t('headers.name')"
        />

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
        <v-tab>
          {{ $t(`$ezreeport.templates.tabs.template`) }}
          <v-icon small class="ml-1">mdi-arrow-expand</v-icon>

          <v-tooltip
            top
            v-if="templateValidation !== true"
            color="warning"
          >
            <template #activator="{ attrs, on }">
              <v-icon
                color="warning"
                small
                class="ml-1"
                v-bind="attrs"
                v-on="on"
              >
                mdi-alert
              </v-icon>
            </template>

            <span>{{ templateValidation }}</span>
          </v-tooltip>
        </v-tab>

        <v-tab>
          {{ $t(`$ezreeport.templates.tabs.tasks`) }}
          <v-icon small class="ml-1">mdi-arrow-expand</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text style="position: relative">
        <v-progress-circular
          v-if="!data"
          style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
          indeterminate
          size="50"
        />
        <template v-else>
          <v-tabs-items v-model="currentTab" class="mt-2">
            <v-tab-item>
              <div class="pa-2">
                <TagsForm v-model="data.tags" :availableTags="availableTags" />
              </div>

              <TemplateForm />
            </v-tab-item>

            <v-tab-item>
              <SimpleTaskTable :value="data.tasks" />
            </v-tab-item>
          </v-tabs-items>
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
          :disabled="!data || templateStore.isCurrentValid !== true || !isModified"
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
import { defineComponent, type PropType } from 'vue';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import hash from 'object-hash';

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
    id: {
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
    dataHash: '',
    bodyHash: '',

    currentTab: 0,

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
        readOne: has('templates-get-template'),
        update: has('templates-put-template'),
      };
    },
    /**
     * If template body was modified since last fetch
     */
    isBodyModified() {
      if (!this.templateStore.current) {
        return false;
      }

      return hash(this.templateStore.current) !== this.bodyHash;
    },
    /**
     * If template data was modified since last fetch
     */
    isModified() {
      if (this.isBodyModified) {
        return true;
      }

      if (!this.data) {
        return false;
      }

      return this.dataHash !== this.hashData(this.data);
    },
    /**
     * Name validation, which is outside of form
     */
    valid() {
      return this.rules.name.every((rule) => rule(this.data?.name ?? '') === true);
    },
    /**
     * Is task's template valid
     */
    templateValidation(): true | string {
      const valid = this.templateStore.isCurrentValid;
      if (valid === true) {
        return true;
      }

      let err = this.$t(valid.i18nKey);
      if (valid.figure !== undefined) {
        err = this.$t('$ezreeport.figures.errors._detail', { valid: err, at: valid.figure + 1 });
      }
      if (valid.layout !== undefined) {
        err = this.$t('$ezreeport.layouts.errors._detail', { valid: err, at: valid.layout + 1 });
      }
      if (valid.field) {
        err = this.$t('$ezreeport.errors._detail', { valid: err, field: valid.field });
      }
      return err.toString();
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
  async mounted() {
    await this.fetch();
    await Promise.all([
      this.templateStore.refreshAvailableIndices(),
      this.templateStore.fetchCurrentMapping(),
    ]);
  },
  methods: {
    hashData: (data: object) => {
      const excludedKeys = new Set<keyof BodyLessFullTemplate>(['tasks']);
      return hash(
        data,
        {
          excludeKeys: (key: string) => excludedKeys.has(key as keyof BodyLessFullTemplate),
        },
      );
    },
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
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.id);
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        const { body, ...data } = content;
        this.templateStore.SET_CURRENT(body);
        this.data = data;

        this.bodyHash = this.templateStore.current ? hash(this.templateStore.current) : '';
        this.dataHash = this.hashData(data);

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

      if (!this.id || !this.perms.update) {
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
          {
            id: this.data.id,
            body,
            name: this.data.name,
            tags: this.data.tags ?? [],
          },
        );

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { body: _, ...data } = content;

        this.$emit('updated', content);
        this.data = data;

        this.bodyHash = this.templateStore.current ? hash(this.templateStore.current) : '';
        this.dataHash = this.hashData(data);

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
