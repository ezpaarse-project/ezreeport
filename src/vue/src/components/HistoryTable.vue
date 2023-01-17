<template>
  <v-col>
    <v-row>
      <InstitutionSelect
        v-model="currentInstitution"
        @input="fetch()"
      />
    </v-row>

    <v-row>
      <div>
        <LoadingToolbar :text="$t('title').toString()">
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />
        </LoadingToolbar>
        <InternalHistoryTable
          :history="history"
          class="history-table"
        />
      </div>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { history } from 'ezreeport-sdk-js';
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    currentInstitution: '',
    history: [] as history.HistoryWithTask[],
    interval: undefined as number | undefined,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readAll: perms?.['tasks-get'],
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
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
      if (this.perms.readAll) {
        this.loading = true;
        try {
          // TODO: pagination
          const { content } = await this.$ezReeport.sdk.history.getAllEntries(
            undefined,
            this.currentInstitution || undefined,
          );
          this.history = content;
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      } else {
        this.history = [];
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.history-table::v-deep .v-data-table {
  border-top-left-radius: 0;
    border-top-right-radius: 0;
}
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
