<template>
  <v-row class="mx-0">
    <TemplateDialogRead
      v-if="taskTemplate && perms.readOne"
      v-model="readTemplateDialogShown"
      :name="taskTemplate.extends"
    />

    <v-col style="position: relative">
      <v-row>
        <!-- Global options -->
        <v-col>
          <v-select
            v-if="taskTemplate"
            :value="taskTemplate.extends"
            :label="$t('$ezreeport.templates.base')"
            :items="[taskTemplate.extends]"
            readonly
            @change="onTemplateUpdate({ extends: $event })"
          >
            <template #append-outer>
              <v-btn v-if="perms.readOne" @click="openBaseDialog()">
                {{ $t('$ezreeport.open') }}
              </v-btn>
            </template>
          </v-select>

          <div class="d-flex">
            <v-text-field
              v-if="taskTemplate"
              :value="templateStore.currentFetchOptions?.index"
              :label="$t('$ezreeport.fetchOptions.index').toString()"
              readonly
              dense
              class="pt-4"
              @input="onFetchOptionUpdate({ index: $event })"
            />

            <v-text-field
              :value="templateStore.currentFetchOptions?.dateField"
              :label="$t('$ezreeport.fetchOptions.dateField').toString()"
              dense
              class="pt-4"
              @input="onFetchOptionUpdate({ dateField: $event })"
            />
          </div>

          <CustomSection
            :label="$t('$ezreeport.fetchOptions.filters').toString()"
            :collapse-disabled="(templateStore.currentFetchOptions?.filtersCount ?? 0) <= 0"
            collapsable
          >
            <ElasticFilterBuilder
              :value="templateStore.currentFetchOptions?.filters ?? {}"
              readonly
            />
          </CustomSection>
        </v-col>
      </v-row>

      <v-card
        outlined
        elevation="0"
      >
        <v-card-subtitle class="py-2 pl-2">
          <v-btn
            icon
            x-small
            @click="templateEditorCollapsed = !templateEditorCollapsed"
          >
            <v-icon>mdi-chevron-{{ templateEditorCollapsed === false ? 'up' : 'down' }}</v-icon>
          </v-btn>

          {{ $tc('$ezreeport.templates.editor', templateStore.currentLayouts.length) }}
        </v-card-subtitle>

        <v-divider />

        <v-card-text
          v-show="!templateEditorCollapsed"
          :class="['pa-0', $vuetify.theme.dark ? 'grey darken-3' : 'grey lighten-4']"
        >
          <v-row class="ma-0" style="height: 600px;">
            <v-col cols="2" class="pa-0" style="height: 100%;">
              <LayoutDrawer
                v-model="selectedLayoutId"
                mode="view"
              />
            </v-col>

            <v-divider vertical />

            <v-col class="pa-0" style="margin-left: 1px;">
              <LayoutViewer
                v-if="selectedLayout"
                :value="selectedLayoutId"
                mode="view"
                style="height: 100%;"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <CustomSection
        :label="$t('$ezreeport.advanced_parameters').toString()"
        :default-value="true"
        collapsable
      >
        <v-switch
          :label="$t('$ezreeport.show_json')"
          v-model="rawTemplateShown"
        />

        <v-select
          v-if="fullTemplate"
          :label="$t('$ezreeport.templates.renderer')"
          :value="fullTemplate.renderer"
          :items="availableRenderer"
          placeholder="vega-pdf"
          persistent-placeholder
          readonly
        />

        <CustomSection>
          <ToggleableObjectTree
            :label="$t('$ezreeport.fetchOptions.title').toString()"
            :value="templateStore.currentFetchOptions?.others ?? {}"
          />
        </CustomSection>

        <CustomSection v-if="fullTemplate">
          <ToggleableObjectTree
            :label="$t('$ezreeport.templates.renderOptions').toString()"
            :value="fullTemplate.renderOptions || {}"
          />
        </CustomSection>
      </CustomSection>

      <ErrorOverlay v-model="error" />
    </v-col>

    <v-slide-x-reverse-transition>
      <v-col v-if="rawTemplateShown" cols="5">
        <JSONPreview :value="rawTemplate" />
      </v-col>
    </v-slide-x-reverse-transition>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { type AnyCustomTemplate, type CustomTemplate, type CustomTaskTemplate } from '~/lib/templates/customTemplates';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore, { isFullTemplate, isTaskTemplate } from '~/stores/template';
import type ElasticFilterBuilderConstructor from '../../utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
  mixins: [ezReeportMixin],
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    readTemplateDialogShown: false,
    rawTemplateShown: false,
    templateEditorCollapsed: true,

    availableRenderer: ['vega-pdf'],

    selectedLayoutId: '',

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * The current reviewed template
     */
    template(): AnyCustomTemplate | undefined {
      return this.templateStore.current;
    },
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        readOne: has('templates-get-name(*)'),
      };
    },
    /**
     * The template of a task. If the provided template isn't from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    taskTemplate(): CustomTaskTemplate | undefined {
      if (isTaskTemplate(this.template)) {
        return this.template;
      }

      return undefined;
    },
    /**
     * The template. If the provided template is from a task, return undefined
     *
     * Used to simplify casts in TS
     */
    fullTemplate(): CustomTemplate | undefined {
      if (isFullTemplate(this.template)) {
        return this.template;
      }
      return undefined;
    },
    /**
     * The base template. If the provided template is from a task,
     * return the template that it extends, return self otherwise
     */
    baseTemplate(): CustomTemplate | undefined {
      if (isTaskTemplate(this.template)) {
        return this.templateStore.extended;
      }
      return this.fullTemplate;
    },
    /**
     * The selected template to view it's figures
     */
    selectedLayout() {
      return this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.selectedLayoutId,
      );
    },
    /**
     * The template without any client side feature (ids, validation, etc.)
     */
    rawTemplate() {
      return this.templateStore.GET_CURRENT();
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'templateStore.current': function () {
      this.initEditorCollapsed();
    },
  },
  mounted() {
    this.initEditorCollapsed();
  },
  methods: {
    /**
     * Show editor if needed
     */
    initEditorCollapsed() {
      if (this.taskTemplate) {
        this.templateEditorCollapsed = (this.taskTemplate.inserts?.length ?? 0) === 0;
      }

      if (this.fullTemplate) {
        this.templateEditorCollapsed = this.fullTemplate.layouts.length === 0;
      }
    },
    /**
     * Prepare and open dialog of base template
     */
    async openBaseDialog() {
      this.readTemplateDialogShown = true;
      // TODO: AAAAAA
    },
    /**
     * Called when the template is updated
     *
     * @param value The new template
     */
    onTemplateUpdate(value: Partial<AnyCustomTemplate>) {
      if (!this.template) {
        return;
      }

      this.template = {
        ...this.template,
        ...value,
      };
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      this.onTemplateUpdate({
        fetchOptions: {
          ...(this.templateStore.current?.fetchOptions ?? {}),
          ...value,
        },
      });
    },
    onFilterCreated() {
      const builder = this.$refs.filterBuilder as ElasticFilterBuilder | undefined;
      builder?.onElementCreated();
    },
  },
});
</script>

<style lang="scss" scoped>
</style>
