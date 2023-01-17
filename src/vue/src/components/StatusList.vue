<template>
  <v-col>
    <LoadingToolbar
      :text="$t('title').toString()"
      :loading="loading"
    >
      <RefreshButton
        :loading="loading"
        :tooltip="$t('refresh-tooltip').toString()"
        @click="fetch"
      />
    </LoadingToolbar>

    <v-list style="position: relative;">
      <v-list-item
        v-for="status in items"
        :key="status.name"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ status.name }}</div>

            <v-spacer />

            <v-tooltip
              top
              :color="status.color"
            >
              <template #activator="{ on, attrs }">
                <v-chip
                  :color="status.color"
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ status.text }}
                </v-chip>
              </template>
              <span>{{ status.tooltip }}</span>
            </v-tooltip>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <ErrorOverlay v-model="error" />
    </v-list>
  </v-col>
</template>

<script lang="ts">
import type { health } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

interface StatusItem {
  name: string,
  color: string,
  text: 'OK' | 'KO',
  tooltip: string,
}

export default defineComponent({
  data: () => ({
    loading: false,
    statuses: [] as health.PingResult[],
    error: '',
  }),
  computed: {
    items(): StatusItem[] {
      return this.statuses.map(this.parsePingResult);
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch all connected services and parse result
     */
    async fetch() {
      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.health.checkAllConnectedService();
        this.statuses = content;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Parse ping result into a human readable format
     *
     * @param ping The ping result
     */
    parsePingResult: (ping: health.PingResult): StatusItem => ({
      name: ping.name,
      color: ping.status ? 'success' : 'error',
      text: ping.status ? 'OK' : 'KO',
      tooltip: ping.status ? `${ping.elapsedTime}ms (${ping.statusCode})` : ping.error,
    }),
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    title: "Status"
    refresh-tooltip: "Refresh status list"
  fr:
    title: "Status"
    refresh-tooltip: "Rafraîchir la liste des status"
</i18n>
