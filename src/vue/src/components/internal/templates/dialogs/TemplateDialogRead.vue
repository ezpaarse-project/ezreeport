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
        <template v-if="data">
          <TagsDetail v-if="data.tags.length > 0" :value="data.tags" />

          <TemplateDetail />
        </template>

        <ErrorOverlay v-model="error" />
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
