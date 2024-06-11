<template>
  <v-col v-if="perms.readAll" style="min-height: 300px;">
    <TemplateProvider>
      <TemplateDialogRead
        v-if="perms.readOne && focusedId && readTemplateDialogShown"
        v-model="readTemplateDialogShown"
        :id="focusedId"
        fullscreen
      />

      <TemplateDialogUpdate
        v-if="perms.update && focusedId && updateTemplateDialogShown"
        v-model="updateTemplateDialogShown"
        :id="focusedId"
        :available-tags="availableTags"
        fullscreen
        @updated="fetch"
      />

      <TemplateDialogCreate
        v-if="perms.create && createTemplateDialogShown"
        ref="dialogCreate"
        v-model="createTemplateDialogShown"
        :available-tags="availableTags"
        fullscreen
        @created="onTemplateCreated"
      />

      <TemplatePopoverDelete
        v-if="perms.delete && focusedTemplate && deleteTemplatePopoverShown"
        v-model="deleteTemplatePopoverShown"
        :coords="deleteTemplatePopoverCoords"
        :template="focusedTemplate"
        fullscreen
        @deleted="onTemplateDeleted"
      />
    </TemplateProvider>

    <TemplateFilterDrawer
      v-model="rawFilters"
      :show.sync="filtersShown"
      :tags="availableTags"
      @input="throttledFilterTemplates()"
    />

    <v-data-iterator
      :items="filteredTemplates"
      item-key="id"
    >
      <template #header>
        <LoadingToolbar
          :text="toolbarTitle"
          :loading="loading"
          style="text-transform: capitalize;"
        >
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn icon @click="filtersShown = true" v-bind="attrs" v-on="on">
                <v-badge
                  :value="filters.count > 0"
                  :content="filters.count"
                >
                  <v-icon>mdi-filter</v-icon>
                </v-badge>
              </v-btn>
            </template>

            {{ $t('$ezreeport.filter') }}
          </v-tooltip>

          <v-tooltip top v-if="perms.create">
            <template #activator="{ on, attrs }">
              <v-btn icon color="success" @click="showCreateDialog" v-bind="attrs" v-on="on">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            {{ $t('$ezreeport.create') }}
          </v-tooltip>
        </LoadingToolbar>
      </template>

      <template #no-data>
        <div style="position: relative; min-height: 150px;">
          <v-overlay v-if="!error" absolute>
            <div class="text-center">
              {{ $t('noDataText') }}
            </div>

            <v-btn color="primary" @click="showCreateDialog">
              <v-icon left>mdi-plus</v-icon>

              {{ $t('createFirst') }}
            </v-btn>
          </v-overlay>

          <ErrorOverlay v-model="error" hide-action />
        </div>
      </template>

      <template #default="{ items }">
        <v-list style="position: relative;">
          <v-list-item
            v-for="template in items"
            :key="template.id"
            two-lines
            @click="showTemplateDialog(template)"
          >
            <v-list-item-content>
              <v-list-item-title class="d-flex align-center">
                <div>{{ template.name }}</div>

                <v-spacer />

                <v-tooltip top v-if="perms.create && perms.readOne">
                  <template #activator="{ attrs, on }">
                    <v-btn
                      icon
                      @click.stop="duplicateTemplate(template)"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-content-copy</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('$ezreeport.duplicate') }}</span>
                </v-tooltip>

                <v-tooltip top v-if="perms.delete">
                  <template #activator="{ attrs, on }">
                    <v-btn icon color="error" @click.stop="showDeletePopover(template, $event)" v-bind="attrs" v-on="on">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('$ezreeport.delete') }}</span>
                </v-tooltip>
              </v-list-item-title>

              <v-list-item-subtitle class="d-flex">
                <MiniTagsDetail :model-value="template.tags" />

                <v-spacer />

                <v-tooltip top>
                  <template #activator="{ attrs, on }">
                    <DateFormatDiv
                      :value="template.updatedAt || template.createdAt"
                      class="text-caption text--secondary font-italic"
                      :attrs="attrs"
                      :on="on"
                    />
                  </template>

                  <DateFormatDiv :value="template.createdAt">
                    <template #default="{ date }">
                      {{ $t('created', { date }) }}
                    </template>
                  </DateFormatDiv>
                </v-tooltip>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <ErrorOverlay v-model="error" />
        </v-list>
      </template>
    </v-data-iterator>

  </v-col>
</template>

<script lang="ts">
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent } from 'vue';
import { throttle } from 'lodash';
import Fuse from 'fuse.js';
import ezReeportMixin from '~/mixins/ezr';
import type TemplateDialogCreate from '~/components/internal/templates/dialogs/TemplateDialogCreate.vue';

const fzfTemplates = new Fuse<templates.Template>(
  [],
  {
    keys: ['name'],
    includeScore: true,
  },
);

export default defineComponent({
  mixins: [ezReeportMixin],
  data: () => ({
    readTemplateDialogShown: false,
    updateTemplateDialogShown: false,
    createTemplateDialogShown: false,
    skipCreateInit: false,
    deleteTemplatePopoverShown: false,
    deleteTemplatePopoverCoords: { x: 0, y: 0 },

    focusedId: '',
    templates: [] as templates.Template[],

    rawFilters: {} as Record<keyof templates.Template, any>,
    filteredTemplates: [] as templates.Template[],
    filtersShown: false,

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
        readOne: has('templates-get-template'),
        update: has('templates-put-template'),
        create: has('templates-post'),
        delete: has('templates-delete-template'),
      };
    },
    /**
     * Title of the toolbar
     */
    toolbarTitle() {
      const options = {
        title: this.$tc('$ezreeport.template', this.templates.length),
        count: this.templates.length,
        filtered: this.filteredTemplates.length,
      };

      if (options.count === options.filtered) {
        return this.$tc('title', 1, options);
      }
      return this.$tc('title', 2, options);
    },
    /**
     * Focused template
     */
    focusedTemplate() {
      return this.templates.find(({ name }) => name === this.focusedId);
    },
    /**
     * List of all available tags
     */
    availableTags() {
      return [...new Set(this.templates.flatMap(({ tags }) => tags ?? []))];
    },
    /**
     * Count of active filters + their value
     */
    filters() {
      const count = Object.values(this.rawFilters)
        .reduce(
          (prev: number, filter) => {
            // skipping if undefined
            if (!filter) {
              return prev;
            }
            // skipping if empty array
            if (Array.isArray(filter) && filter.length <= 0) {
              return prev;
            }

            return prev + 1;
          },
          0,
        );

      return {
        count,
        value: this.rawFilters,
      };
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
        const { content, meta } = await this.$ezReeport.sdk.templates.getAllTemplates();
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        this.templates = content
          // Remove default template
          .filter(({ id }) => id !== meta.default);
        fzfTemplates.setCollection(this.templates);
        this.filterTemplates();
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
      const index = this.templates.findIndex((t) => t.name === template.name);
      if (index < 0) {
        return;
      }

      const templates = [...this.templates];
      templates.splice(index, 1, { ...template });
      this.templates = templates;
    },
    /**
     * Called when a template is created by a dialog
     */
    onTemplateCreated(template: templates.FullTemplate) {
      this.fetch();
      this.createTemplateDialogShown = false;
      this.showTemplateDialog(template);
    },
    /**
     * Called when a template is deleted by a dialog
     */
    onTemplateDeleted() {
      this.fetch();
    },
    /**
     * Prepare and open read dialog
     */
    async showTemplateDialog({ id }: templates.Template) {
      if (
        !this.perms.readOne
        && !this.perms.update
      ) {
        return;
      }

      this.focusedId = id;
      await this.$nextTick();
      if (this.perms.update) {
        this.updateTemplateDialogShown = true;
      } else {
        this.readTemplateDialogShown = true;
      }
    },
    /**
     * Prepare and show template creation dialog
     */
    async showCreateDialog() {
      this.focusedId = '';
      await this.$nextTick();
      this.createTemplateDialogShown = true;
    },
    /**
     * Prepare and show template edition dialog
     *
     * @param item The item
     */
    async showEditDialog({ name }: templates.Template) {
      this.focusedId = name;
      await this.$nextTick();
      this.updateTemplateDialogShown = true;
    },
    /**
     * Prepare and show template deletion popover
     *
     * @param item The item
     * @param event The base event
     */
    async showDeletePopover({ name }: templates.Template, event: MouseEvent) {
      this.focusedId = name;
      this.deleteTemplatePopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.deleteTemplatePopoverShown = true;
    },
    /**
     * Duplicate and open template
     *
     * @param template The template to duplicate
     */
    async duplicateTemplate(template: templates.Template) {
      if (
        !this.perms.readOne
        && !this.perms.create
      ) {
        return;
      }

      await this.showCreateDialog();
      (this.$refs.dialogCreate as InstanceType<typeof TemplateDialogCreate>)
        ?.openFromTemplate(template);
    },
    /**
     * Filter template using active filters
     */
    filterTemplates() {
      let res = [...this.templates];
      res.sort((a, b) => a.name.localeCompare(b.name));

      if (this.rawFilters.name) {
        res = fzfTemplates.search(this.rawFilters.name)
          .map(({ item }) => item);
      }

      if (this.rawFilters.tags?.length > 0) {
        // '' actually means: no tags
        if (this.rawFilters.tags.includes('')) {
          res = res.filter(({ tags }) => tags.length === 0);
        } else {
          const wantedTags = new Set<string>(this.rawFilters.tags);
          res = res.filter(({ tags }) => tags.some((t) => wantedTags.has(t.name)));
        }
      }

      this.filteredTemplates = res;
    },
    /**
     * Throttled filter
     */
    throttledFilterTemplates: throttle(
      // eslint-disable-next-line func-names
      function (this: any) { this.filterTemplates(); },
      1000,
      { leading: true },
    ),
  },
});
</script>

<style lang="scss" scoped>
.more-tags-list {
  padding-left: 1em;
  list-style-type: '- ';
}
</style>

<i18n lang="yaml">
en:
  noDataText: 'No template'
  createFirst: 'Create the first template'
  refresh-tooltip: 'Refresh template list'
  title: '{title} ({count})|{title} ({filtered}/{count})'
  created: 'Created: {date}'
fr:
  noDataText: 'Aucun modèle'
  createFirst: 'Créer le premier modèle'
  refresh-tooltip: 'Rafraîchir la liste des modèles'
  title: '{title} ({count})|{title} ({filtered}/{count})'
  created: 'Créé le {date}'
</i18n>
