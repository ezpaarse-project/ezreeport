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
          {{$t('description', { name: task.name })}}
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
          color="success"
          @click="save"
        >
          {{ $t('actions.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    task: {
      type: Object as PropType<tasks.Task | tasks.FullTask>,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    deleted: (task: tasks.FullTask) => !!task,
  },
  data: () => ({
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      const namespaces = 'namespaceId' in this.task ? [this.task.namespaceId] : [this.task.namespace.id];

      return {
        readOne: has('tasks-get-task', namespaces),
        delete: has('tasks-delete-task', namespaces),
      };
    },
  },
  methods: {
    async save() {
      if (!this.perms.readOne || !this.perms.delete) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.tasks.getTask(this.task.id);
        await this.$ezReeport.sdk.tasks.deleteTask(this.task.id);

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
  title: 'Delete report ?'
  description: 'Do you really want to delete the report "{name}" ? This action is irreversible.'
  actions:
    cancel: 'Cancel'
    confirm: 'OK'
fr:
  title: 'Supprimer le rapport ?'
  description: 'Voulez-vous définitivement supprimer le rapport "{name}" ? Cette action est irréversible.'
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
</i18n>
