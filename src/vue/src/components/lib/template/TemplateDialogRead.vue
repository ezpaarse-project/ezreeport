<template>
  <v-dialog :value="value" scrollable @input="$emit('input', $event)">
    <v-card :loading="loading">
      <v-card-title>
        <div v-if="item">
          {{ item.name }}
        </div>

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
        <TemplateDetail v-if="item?.template" :template="item.template" />

        <ErrorOverlay v-model="error" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
  },
  data: () => ({
    item: undefined as templates.FullTemplate | undefined,

    error: '',
    loading: false,
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readOne: perms?.['templates-get-name(*)'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
    },
    name() {
      this.fetch();
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
        this.item = undefined;
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.name);
        this.item = content;
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
