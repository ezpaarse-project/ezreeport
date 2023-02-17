<template>
  <v-col>
    <LoadingToolbar
      :text="$t('title').toString()"
      :loading="loading"
    >
      <v-tooltip top>
        <template #activator="{ attrs, on }">
          <v-chip
            href="https://github.com/ezpaarse-project/ezreeport/releases?q=ezreeport-vue&expanded=true"
            target="_blank"
            rel="noopener noreferrer"
            v-bind="attrs"
            v-on="on"
          >
            v{{ clientVersion }}
          </v-chip>
        </template>

        <span>{{$t('version-tooltip.client', { sdk: $ezReeport.sdk.version })}}</span>
      </v-tooltip>

      <RefreshButton
        :loading="loading"
        :tooltip="$t('refresh-tooltip').toString()"
        @click="fetch"
      />
    </LoadingToolbar>

    <v-divider />

    <v-list style="position: relative;">
      <v-list-item
        v-for="status in items"
        :key="status.name"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ status.name }}</div>

            <v-spacer />

            <v-tooltip top v-if="server.name === status.name">
              <template #activator="{ attrs, on }">
                <v-chip
                  :color="versionCompat.color"
                  :outlined="!server.version"
                  href="https://github.com/ezpaarse-project/ezreeport/releases?q=ezreeport-report&expanded=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mr-2"
                  v-bind="attrs"
                  v-on="on"
                >
                  v{{ server.version || '...' }}
                </v-chip>
              </template>

              <span>{{versionCompat.tooltip}}</span>
            </v-tooltip>

            <v-tooltip
              :color="status.color"
              top
            >
              <template #activator="{ on, attrs }">
                <v-chip
                  :color="status.color"
                  outlined
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
import { defineComponent } from 'vue';
import { version } from '~/../package.json';

interface StatusItem {
  name: string,
  color: string,
  text: 'OK' | 'KO',
  tooltip: string,
}

export default defineComponent({
  data: () => ({
    statuses: [] as health.PingResult[],
    clientVersion: version,
    server: {
      name: '',
      version: '',
    },

    loading: false,
    error: '',
  }),
  computed: {
    items(): StatusItem[] {
      return this.statuses.map(this.parsePingResult);
    },
    versionCompat() {
      if (this.server.version) {
        const [clientMajor, clientMinor] = this.clientVersion.split('.', 3);
        const [serverMajor, serverMinor] = this.server.version.split('.', 3);

        if (+clientMajor !== +serverMajor) {
          return { color: 'error', tooltip: this.$t('version-tooltip.mismatch') };
        }

        if (+clientMinor !== +serverMinor) {
          return { color: 'warning', tooltip: this.$t('version-tooltip.mismatch') };
        }
      }

      return { color: '', tooltip: this.$t('version-tooltip.server') };
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

        const { content: result } = await this.$ezReeport.sdk.health.getAllConnectedServices();
        this.server = {
          name: result.current,
          version: result.currentVersion,
        };

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
en:
  title: 'Status'
  refresh-tooltip: 'Refresh status list'
  version-tooltip:
    client: 'Client version (SDK: v{sdk})'
    server: 'API version'
    mismatch: 'Client version is not compatible with API version. It may result in unwanted behavior.'
fr:
  title: 'Status'
  refresh-tooltip: 'Rafraîchir la liste des status'
  version-tooltip:
    client: 'Version du Client (SDK: v{sdk})'
    server: "Version de l'API"
    mismatch: "La version du client n'est pas compatible avec la version de l'API. Cela peut résulter en un comportement anormal."
</i18n>
