<template>
  <v-dialog
    :value="value"
    :fullscreen="fullscreen"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading" :tile="fullscreen">
      <v-card-title>
        <v-skeleton-loader v-if="!data" type="card-heading" width="500" />
        <template v-else>
          {{ data.name }}
        </template>

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
        <v-tab>
          {{ $t(`$ezreeport.templates.tabs.template`) }}
          <v-icon small class="ml-1">mdi-arrow-expand</v-icon>
        </v-tab>

        <v-tab>
          {{ $t(`$ezreeport.templates.tabs.tasks`) }}
          <v-icon small class="ml-1">mdi-arrow-expand</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-progress-circular
          v-if="!data"
          style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
          indeterminate
          size="50"
        />
        <template v-else>
          <v-tabs-items v-model="currentTab" class="mt-2">
            <v-tab-item>
              <TagsDetail :value="data.tags" />

              <v-row>
                <v-col>
                  <v-text-field
                    :value="templateStore.currentFetchOptions?.dateField"
                    :label="$t('$ezreeport.fetchOptions.dateField').toString()"
                    readonly
                    dense
                    class="pt-4"
                  />
                </v-col>
              </v-row>

              <CustomSection
                :label="$t('$ezreeport.fetchOptions.filters').toString()"
                :collapse-disabled="(templateStore.currentFetchOptions?.filtersCount ?? 0) <= 0"
                collapsable
              >
                <ElasticFilterBuilder
                  ref="filterBuilder"
                  :value="templateStore.currentFetchOptions?.filters ?? {}"
                />
              </CustomSection>

              <CustomSection :label="$t('$ezreeport.preview').toString()">
                <LayoutPreview
                  :layouts="templateStore.currentLayouts"
                  :grid="templateStore.currentGrid"
                  outlined
                />
              </CustomSection>
            </v-tab-item>

            <v-tab-item>
              <SimpleTaskTable :value="data.tasks" />
            </v-tab-item>
          </v-tabs-items>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent } from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore from '~/stores/template';

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
  },
  emits: {
    input: (show: boolean) => show !== undefined,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    data: undefined as BodyLessFullTemplate | undefined,

    currentTab: 0,

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
        readOne: has('templates-get-template'),
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
  mounted() {
    this.fetch();
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
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.id);
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
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  refresh-tooltip: 'Refresh template'
fr:
  refresh-tooltip: 'Rafraîchir le modèle'
</i18n>
