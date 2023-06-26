<template>
  <div>
    <slot />

    <v-snackbar
      :value="!!error"
      :timeout="5000"
      color="red accent-2"
      @input="error = undefined"
    >
      {{ error }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { type CustomTemplate, addAdditionalDataToLayouts } from '~/lib/templates/customTemplates';
import ezr from '~/mixins/ezr';
import useTemplateStore, { isTaskTemplate } from '~/stores/template';

export default defineComponent({
  mixins: [ezr],
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    error: undefined as string | undefined,
  }),
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': async function () {
      this.refreshAvailableTemplates();

      if (isTaskTemplate(this.templateStore.current)) {
        const extended = await this.fetch(this.templateStore.current.extends);
        this.templateStore.extended = extended;
      }
    },
    // eslint-disable-next-line func-names
    'templateStore.current': function () {
      this.templateStore.validateCurrent();
    },
    // eslint-disable-next-line func-names
    'templateStore.current.extends': function (newVal: string) {
      if (newVal) {
        this.fetch(newVal)
          .then((extended) => { this.templateStore.extended = extended; });
      }
    },
  },
  mounted() {
    this.refreshAvailableTemplates();
  },
  methods: {
    /**
     * Fetch given template
     *
     * @param name The template name
     */
    async fetch(name: string) {
      const hasReadOne = this.$ezReeport.hasGeneralPermission('templates-get-name(*)');
      if (!hasReadOne) {
        return undefined;
      }

      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(name);
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }
        content.body.layouts = addAdditionalDataToLayouts(content.body.layouts);

        return content.body as CustomTemplate;
      } catch (error) {
        this.error = (error as Error).message;
        return undefined;
      }
    },

    /**
     * Fetch all available templates
     */
    async refreshAvailableTemplates() {
      const hasReadAll = this.$ezReeport.hasGeneralPermission('templates-get');
      if (!hasReadAll) {
        return;
      }

      try {
        const { content } = await this.$ezReeport.sdk.templates.getAllTemplates();
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

        this.templateStore.available = content;
      } catch (error) {
        this.error = (error as Error).message;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
