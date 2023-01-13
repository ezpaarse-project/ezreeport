<template>
  <v-col>
    <v-row>
      <InstitutionSelect
        v-model="currentInstitution"
        @input="fetch()"
        @fetched="institutions = $event"
      />
    </v-row>

    <v-row>
      <LoadingToolbar :text="$t('title').toString()">
        <RefreshButton
          :loading="loading"
          :tooltip="$t('refresh-tooltip').toString()"
          @click="fetch"
        />
      </LoadingToolbar>
      <InternalHistoryTable :history="history" />
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { auth, history } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    institutions: [] as auth.Institution[],
    currentInstitution: '',
    history: [] as history.History[],
    interval: undefined as number | undefined,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth_permissions;
      return {
        readAll: perms?.['tasks-get'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth_permissions': function () {
      if (this.perms.readAll) {
        this.fetch();
      } else {
        this.history = [];
      }
    },
  },
  mounted() {
    this.interval = setInterval(() => this.fetch(), 5000);
  },
  destroyed() {
    clearInterval(this.interval);
  },
  methods: {
    /**
     * Fetch tasks and parse result
     */
    async fetch() {
      this.loading = true;
      try {
        // TODO: pagination
        const { content } = await this.$ezReeport.history.getAllEntries(
          undefined,
          this.currentInstitution || undefined,
        );
        this.history = content;
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
  },
});
</script>

<style lang="scss" scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    title: History of tasks
    refresh-tooltip: Refresh history
  fr:
    title: Historique des tâches
    refresh-tooltip: Rafraîchir l'historique'
</i18n>
