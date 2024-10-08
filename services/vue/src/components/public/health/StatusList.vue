<template>
  <v-col>
    <LoadingToolbar
      :text="$t('title').toString()"
      :loading="loading"
    >
      <v-tooltip top>
        <template #activator="{ attrs, on }">
          <v-chip
            :href="`https://github.com/ezpaarse-project/ezreeport/releases?q=${client.name}&expanded=true`"
            target="_blank"
            rel="noopener noreferrer"
            v-bind="attrs"
            v-on="on"
          >
            v{{ client.version }}
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
                  :href="`https://github.com/ezpaarse-project/ezreeport/releases?q=${server.name}&expanded=true`"
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
import { defineComponent } from 'vue';
import { diff as semverDiff, type ReleaseType } from 'semver';
import type { health } from '@ezpaarse-project/ezreeport-sdk-js';

import { version, name } from '~/../package.json';
import ezReeportMixin from '~/mixins/ezr';

interface StatusItem {
  name: string,
  color: string,
  text: 'OK' | 'KO',
  tooltip: string,
}

const WARNING_DIFFS: Set<ReleaseType | null> = new Set([
  'minor',
  'preminor',
]);

const ALLOWED_DIFFS: Set<ReleaseType | null> = new Set([
  'patch',
  'prepatch',
  null,
]);

export default defineComponent({
  mixins: [ezReeportMixin],
  data: () => ({
    statuses: [] as health.PingResult[],
    client: {
      name,
      version,
    },
    server: {
      name: '',
      version: '',
    },

    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const has = this.$ezReeport.hasGeneralPermission;
      return {
        checkAll: has('health-get'),
        readAll: has('health-get-all'),
      };
    },
    items(): StatusItem[] {
      return this.statuses.map(this.parsePingResult);
    },
    versionCompat() {
      if (this.server.version) {
        const clientVersion = this.client.version;
        const serverVersion = this.server.version;

        const diff = semverDiff(serverVersion, clientVersion);

        if (ALLOWED_DIFFS.has(diff)) {
          return { color: '', tooltip: this.$t('version-tooltip.server') };
        }

        if (WARNING_DIFFS.has(diff)) {
          return { color: 'warning', tooltip: this.$t('version-tooltip.mismatch') };
        }
      }

      return { color: 'error', tooltip: this.$t('version-tooltip.mismatch') };
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
        if (!content) {
          throw new Error(this.$t('$ezreeport.errors.fetch').toString());
        }

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
    error: "Unknown version"
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  title: 'Status'
  refresh-tooltip: 'Rafraîchir la liste des status'
  version-tooltip:
    client: 'Version du Client (SDK: v{sdk})'
    server: "Version de l'API"
    mismatch: "La version du client n'est pas compatible avec la version de l'API. Cela peut résulter en un comportement anormal."
    error: "Version inconnue"
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
