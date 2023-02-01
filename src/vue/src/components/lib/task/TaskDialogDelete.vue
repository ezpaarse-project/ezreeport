<template>
  <v-dialog max-width="500" :value="value" @input="$emit('input', $event)">
    <v-card :loading="loading">
      <v-card-title>
        <div>{{$t('title')}}</div>

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
          :disabled="!perms.delete"
          :loading="loading"
          color="success"
          @click="save"
        >
          {{ $t('actions.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    task: {
      type: Object as PropType<tasks.Task | tasks.FullTask>,
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
      const perms = this.$ezReeport.auth.permissions;
      return {
        delete: perms?.['tasks-delete-task'],
      };
    },
  },
  methods: {
    async save() {
      if (!this.perms.delete) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.tasks.deleteTask(this.task.id);

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
  description: 'Voulez-vous définitivement supprimer le rapport "{name}" ? Cette action est irrévérsible.'
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
</i18n>
