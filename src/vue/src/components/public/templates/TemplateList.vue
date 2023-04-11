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
      :available-tags="availableTags"
      fullscreen
      @updated="onTemplateEdited"
    />

    <TemplateDialogCreate
      v-if="perms.create"
      v-model="createTemplateDialogShown"
      :available-tags="availableTags"
      fullscreen
      @created="onTemplateCreated"
    />

    <TemplatePopoverDelete
      v-if="perms.delete && focusedTemplate"
      v-model="deleteTemplatePopoverShown"
      :coords="deleteTemplatePopoverCoords"
      :template="focusedTemplate"
      fullscreen
      @deleted="onTemplateDeleted"
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

      <v-tooltip top v-if="perms.create">
        <template #activator="{ on, attrs }">
          <v-btn icon color="success" @click="showCreateDialog" v-bind="attrs" v-on="on">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>

        {{$t('actions.create')}}
      </v-tooltip>
    </LoadingToolbar>

    <v-divider />

    <v-list style="position: relative;">
      <v-list-item
        v-for="template in templates"
        :key="template.name"
        two-lines
        @click="showTemplateDialog(template)"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ template.name }}</div>

            <v-spacer />

            <v-tooltip top v-if="perms.update">
              <template #activator="{ attrs, on }">
                <v-btn icon color="info" @click.stop="showEditDialog(template)" v-on="on" v-bind="attrs">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('actions.edit') }}</span>
            </v-tooltip>

            <v-tooltip top v-if="perms.delete">
              <template #activator="{ attrs, on }">
                <v-btn icon color="error" @click.stop="showDeletePopover(template, $event)" v-bind="attrs" v-on="on">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('actions.delete') }}</span>
            </v-tooltip>
          </v-list-item-title>

          <v-list-item-subtitle>
            <v-chip
              v-for="tag in tagMap[template.name].value"
              :key="tag.name"
              :color="tag.color"
              small
              class="mr-2"
              style="pointer-events: none;"
            >
              {{ tag.name }}
            </v-chip>

            <v-tooltip v-if="tagMap[template.name].tooltip" top>
              <template #activator="{ attrs, on }">
                <v-icon v-bind="attrs" v-on="on">mdi-dots-horizontal</v-icon>
              </template>

              <span>{{ tagMap[template.name].tooltip }}</span>
            </v-tooltip>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <ErrorOverlay v-model="error" />
    </v-list>
  </v-col>
</template>

<script lang="ts">
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';
import { Tag } from '~/components/internal/templates/forms/TagsForm.vue';
import ezReeportMixin from '~/mixins/ezr';

const MAX_TAGS_SHOWN = 4;

export default defineComponent({
  mixins: [ezReeportMixin],
  data: () => ({
    readTemplateDialogShown: false,
    updateTemplateDialogShown: false,
    createTemplateDialogShown: false,
    deleteTemplatePopoverShown: false,
    deleteTemplatePopoverCoords: { x: 0, y: 0 },

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
        create: has('templates-post'),
        delete: has('templates-delete-name(*)'),
      };
    },
    /**
     * Focused template
     */
    focusedTemplate() {
      return this.templates.find(({ name }) => name === this.focusedName);
    },
    /**
     * List of all available tags
     */
    availableTags() {
      return [...new Set(this.templates.flatMap(({ tags }) => tags ?? []))];
    },
    tagMap() {
      const map = new Map<string, { value: Tag[], tooltip?: string }>();

      for (let i = 0; i < this.templates.length; i += 1) {
        const { tags, name } = this.templates[i];
        map.set(name, {
          value: tags.slice(0, MAX_TAGS_SHOWN),
          tooltip: tags.length > MAX_TAGS_SHOWN ? tags.slice(MAX_TAGS_SHOWN).map((t) => t.name).join(', ') : undefined,
        });
      }

      return Object.fromEntries(map);
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
    onTemplateCreated() {
      this.fetch();
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
    async showTemplateDialog({ name }: templates.Template) {
      this.focusedName = name;
      await this.$nextTick();
      this.readTemplateDialogShown = true;
    },
    /**
     * Prepare and show template creation dialog
     */
    async showCreateDialog() {
      this.focusedName = '';
      await this.$nextTick();
      this.createTemplateDialogShown = true;
    },
    /**
     * Prepare and show template edition dialog
     *
     * @param item The item
     */
    async showEditDialog({ name }: templates.Template) {
      this.focusedName = name;
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
      this.focusedName = name;
      this.deleteTemplatePopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.deleteTemplatePopoverShown = true;
    },
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
  title: 'Templates'
  refresh-tooltip: 'Refresh template list'
  errors:
    no_data: 'An error occurred when fetching data'
  actions:
    create: 'Create'
    edit: 'Edit'
    delete: 'Delete'
fr:
  title: 'Modèles'
  refresh-tooltip: 'Rafraîchir la liste des modèles'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
  actions:
    create: 'Créer'
    edit: 'Éditer'
    delete: 'Supprimer'
</i18n>
