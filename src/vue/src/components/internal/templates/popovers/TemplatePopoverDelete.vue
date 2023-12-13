<template>
  <v-menu
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    offset-y
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title>
        {{$t('title')}}

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <div>
          {{$t('description', { name: template.name })}}
        </div>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.delete"
          :loading="loading"
          color="error"
          @click="save"
        >
          {{ $t('actions.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    template: {
      type: Object as PropType<templates.Template>,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    deleted: (task: templates.Template) => !!task,
  },
  data: () => ({
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;

      return {
        getOne: has('templates-get-template'),
        delete: has('templates-delete-template'),
      };
    },
  },
  methods: {
    async save() {
      if (!this.perms.getOne || !this.perms.delete) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.templates.getTemplate(this.template.id);
        await this.$ezReeport.sdk.templates.deleteTemplate(this.template.id);

        this.$emit('deleted', content);
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
  title: 'Delete template ?'
  description: 'Do you really want to delete the template "{name}" ? This action is irreversible.'
  actions:
    cancel: 'Cancel'
    confirm: 'OK'
fr:
  title: 'Supprimer le modèle ?'
  description: 'Voulez-vous définitivement supprimer le modèle "{name}" ? Cette action est irréversible.'
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
</i18n>
