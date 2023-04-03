<template>
  <v-dialog
    :value="value"
    scrollable
    fullscreen
    transition="ezr_dialog-right-transition"
    @input="$emit('input', $event)"
  >
    <v-card :loading="job.progress !== 0" tile>
      <template #progress>
        <v-progress-linear
          :value="job.progress * 100"
          :color="statusColor"
        />
      </template>

      <v-card-title>
        {{$t('title', { id: job.id, queue })}}

        <v-chip :color="statusColor" outlined class="text-body-2 ml-2">
          {{ job.status }}
        </v-chip>

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

      <v-card-text style="position: relative;">
        <v-row class="mt-2">
          <v-col>
            <div>
              <v-icon>mdi-restart</v-icon>
              {{$t('headers.attempts')}}:
              {{ job.attempts }}
            </div>

            <div>
              <v-icon>mdi-calendar-import</v-icon>
              {{$t('headers.added')}}:
              {{ added }}
            </div>

            <div>
              <v-icon>mdi-progress-helper</v-icon>
              {{$t('headers.progress')}}:
              {{ progress }}
            </div>
          </v-col>

          <v-col>
            <div v-if="started">
              <v-icon>mdi-timer-play-outline</v-icon>
              {{$t('headers.started')}}:
              {{ started }}
            </div>

            <div v-if="ended">
              <v-icon>mdi-timer-stop-outline</v-icon>
              {{$t('headers.ended')}}:
              {{ ended }}
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-divider />
        </v-row>

        <v-row>
          <v-col>
            <v-tabs v-model="currentTab" style="flex-grow: 0;" grow>
              <template v-for="tab in tabs">
                <v-tab v-if="!tab.empty" :key="tab.key">
                  {{ $t(`tabs.${tab.key}`) }}
                </v-tab>
              </template>
            </v-tabs>

            <v-tabs-items v-model="currentTab" class="mt-2">
              <template v-for="tab in tabs">
                <v-tab-item v-if="!tab.empty" :key="tab.key">
                  <v-row class="mx-0">
                    <v-col>
                      <v-switch v-model="showRawData" :label="$t('headers.show-raw')" />
                      <ObjectTree :value="job[tab.key] ?? {}" class="pb-1" />
                    </v-col>

                    <v-divider vertical />

                    <v-slide-x-reverse-transition>
                      <v-col v-if="showRawData" cols="6">
                        <JSONPreview :value="job[tab.key]" class="mt-4" />
                      </v-col>
                    </v-slide-x-reverse-transition>
                  </v-row>
                </v-tab-item>
              </template>
            </v-tabs-items>
          </v-col>
        </v-row>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions v-if="job.status === 'failed'">
        <v-btn
          :loading="loading"
          color="warning"
          @click="rerunJob"
        >
          {{ $t('actions.rerun') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { queues } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

const tabs = [
  { key: 'data' },
  { key: 'result' },
] as const;

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    job: {
      type: Object as PropType<queues.FullJob<unknown, unknown>>,
      required: true,
    },
    queue: {
      type: String,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (job: queues.FullJob<unknown, unknown>) => !!job,
  },
  data: () => ({
    showRawData: false,
    showRawResult: false,

    interval: undefined as NodeJS.Timer | undefined,
    currentTab: 0,

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      return {
        readOne: has('queues-get-queue-jobs-jobId', []),

        rerun: has('queues-get-queue-jobs-jobId-retry', []),
      };
    },
    /**
     * Data tabs
     */
    tabs() {
      return tabs.map((v) => ({
        ...v,
        empty: this.isEmpty(v),
      }));
    },
    /**
     * Color linked to the status of the job
     */
    statusColor(): string {
      switch (this.job.status) {
        case 'completed':
          return 'success';

        case 'active':
          return 'warning';

        case 'failed':
        case 'stuck':
          return 'error';

        // case 'waiting':
        // case 'delayed':
        // case 'paused':
        default:
          return 'grey';
      }
    },
    /**
     * Data as JSON
     */
    rawData(): string | undefined {
      return this.job.data !== undefined
        ? JSON.stringify(this.job.data, undefined, 2) : undefined;
    },
    /**
     * Result as JSON
     */
    rawResult(): string | undefined {
      return this.job.result !== undefined
        ? JSON.stringify(this.job.result, undefined, 2) : undefined;
    },
    /**
     * Formatted property
     */
    added() {
      return this.job.added?.toLocaleString();
    },
    /**
     * Formatted property
     */
    started() {
      return this.job.started?.toLocaleString();
    },
    /**
     * Formatted property
     */
    ended() {
      return this.job.ended?.toLocaleString();
    },
    /**
     * Formatted property
     */
    progress() {
      return this.job.progress.toLocaleString(undefined, { style: 'percent' });
    },
  },
  /**
   * Called in Vue 2
   */
  destroyed() {
    // Remove highlight.js style
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  /**
   * Called in Vue 3
   */
  unmounted() {
    // Remove highlight.js style
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    /**
     * Check if tab content exists
     *
     * @param key The key of the tab
     */
    isEmpty({ key }: (typeof tabs)[number]) {
      const val = this.job[key];

      if (!val) {
        return true;
      }

      if (typeof val === 'number') {
        return false;
      }

      return Object.keys(val).length <= 0;
    },
    /**
     * Fetch data
     */
    async fetch() {
      if (!this.perms.readOne) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.queues.getJob(
          this.queue,
          this.job.id,
        );
        if (!content) {
          throw new Error(this.$t('errors.no_data').toString());
        }

        this.$emit('updated', content);
        this.$emit('input', false);
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Re-run job
     */
    async rerunJob() {
      if (!this.perms.rerun) {
        this.$emit('input', false);
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.queues.retryJob(
          this.queue,
          this.job.id,
        );

        this.$emit('updated', content);
        this.error = '';

        let timer;
        if (content.status === 'waiting') {
          timer = 1000;
        } else if (content.status === 'active') {
          timer = 250;
        }

        if (timer) {
          this.interval = setInterval(this.fetch, timer);
        }
      } catch (error) {
        this.error = (error as Error).message;
        if (this.interval) {
          clearInterval(this.interval);
        }
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
  title: "{queue}'s job #{id}"
  refresh-tooltip: 'Refresh job'
  tabs:
    data: 'Data'
    result: 'Result'
  headers:
    show-raw: 'Show JSON'
    attempts: 'Attempts count'
    progress: 'Progress'
    added: 'Added at'
    started: 'Started at'
    ended: 'Ended at'
  actions:
    rerun: 'Rerun'
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  title: 'Job de {queue} #{id}'
  refresh-tooltip: 'Rafraîchir le job'
  tabs:
    data: 'Données'
    result: 'Résultat'
  headers:
    show-raw: 'Afficher JSON'
    attempts: "Nombre d'essais"
    progress: 'Progression'
    added: 'Ajouté le'
    started: 'Démarré le'
    ended: 'Fini le'
  actions:
    rerun: 'Relancer'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
