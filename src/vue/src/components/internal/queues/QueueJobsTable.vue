<template>
  <div>
    <QueueJobDialogDetail
      v-if="perms.readOne && focusedJob"
      v-model="detailQueueJobDialogShown"
      :job="focusedJob"
      :queue="queue"
      @updated="onJobEdited"
    />

    <v-data-table
      v-if="perms.readAll"
      :headers="headers"
      :items="items"
      :loading="loading"
      :options.sync="options"
      :server-items-length="totalItems"
      :items-per-page-options="[5, 10, 15]"
      item-key="id"
      class="data-table"
      @click:row="showJobDialog"
      @update:options="onPaginationChange"
    >
      <template #top>
        <LoadingToolbar :text="$t('title', { queue }).toString()">
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />
        </LoadingToolbar>
      </template>

      <template #[`item.id`]="{ value: id }">
        #{{ id }}
      </template>

      <template #[`item.status`]="{ value: status }">
        <v-chip :color="status.color" outlined>
          {{ status.value }}
        </v-chip>
      </template>

      <template #[`item.success`]="{ value: success }">
        <v-icon v-if="success" color="success">mdi-check</v-icon>
        <v-icon v-else color="error">mdi-close</v-icon>
      </template>

      <template v-if="error" #[`body.append`]>
        <ErrorOverlay v-model="error" />
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { queues } from 'ezreeport-sdk-js';
import { DataTableHeader } from '~/types/vuetify';
import type { DataOptions } from 'vuetify';
import ezReeportMixin from '~/mixins/ezr';

type AnyJob = queues.FullJob<unknown, unknown>;

interface JobItem {
  id: string | number,
  status: { color: string, value: string },
  added: string,
  ended?: string,
  success?: boolean
}

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    queue: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    detailQueueJobDialogShown: false,

    options: {
      sortBy: ['added'],
      sortDesc: [false],
    } as DataOptions,

    jobs: [] as AnyJob[],
    lastIds: {} as Record<number, string | number | undefined>,
    totalItems: 0,
    focusedJob: undefined as AnyJob | undefined,

    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.data.auth.permissions;
      return {
        readAll: perms?.['queues-get-queue-jobs'],
        readOne: perms?.['queues-get-queue-jobs-jobId'],
      };
    },
    items() {
      return this.jobs.map(this.parseJob);
    },
    headers() {
      const headers: DataTableHeader<JobItem>[] = [
        {
          value: 'id',
          text: this.$t('headers.id').toString(),
        },
        {
          value: 'status',
          text: this.$t('headers.status').toString(),
        },
        {
          value: 'added',
          text: this.$t('headers.added').toString(),
        },
        {
          value: 'ended',
          text: this.$t('headers.ended').toString(),
        },
      ];

      if (this.items.find((job) => job.success !== undefined)) {
        headers.splice(2, 0, {
          value: 'success',
          text: this.$t('headers.result').toString(),
        });
      }

      return headers;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch all crons and parse result
     */
    async fetch(page?:number) {
      if (!page) {
        // eslint-disable-next-line no-param-reassign
        page = this.options.page;
      }

      if (!this.perms.readAll) {
        this.jobs = [];
        return;
      }

      this.loading = true;
      try {
        const { content, meta } = await this.$ezReeport.sdk.queues.getQueueJobs(
          this.queue,
          {
            previous: this.lastIds[page - 1],
            count: this.options.itemsPerPage,
          },
        );
        if (!content) {
          throw new Error(this.$t('errors.no_data').toString());
        }

        this.jobs = content;
        this.totalItems = meta.total;

        const lastIds = { ...this.lastIds };
        lastIds[page] = meta.lastId as string | number | undefined;
        this.lastIds = lastIds;

        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     *
     * Parse job into human readable format
     *
     * @param job The job
     */
    parseJob(job: AnyJob): JobItem {
      let statusColor;
      switch (job.status) {
        case 'completed':
          statusColor = 'success';
          break;

        case 'active':
          statusColor = 'warning';
          break;

        case 'failed':
        case 'stuck':
          statusColor = 'error';
          break;

        // case 'waiting':
        // case 'delayed':
        // case 'paused':
        default:
          statusColor = 'grey';
          break;
      }

      return {
        id: job.id,
        status: { color: statusColor, value: job.status },
        added: job.added.toLocaleString(),
        ended: job.ended?.toLocaleString(),
        success: job.result && typeof job.result === 'object' && 'success' in job.result
          ? !!job.result.success
          : undefined,
      };
    },
    /**
     * Called when data table options are updated
     *
     * @param opts DataTable options
     */
    onPaginationChange(opts: DataOptions) {
      this.fetch(opts.page);
    },
    /**
     * Prepare and show job detail dialog
     *
     * @param item The item
     */
    showJobDialog(item: JobItem) {
      const job = this.jobs.find(({ id }) => id === item.id);
      if (!job) {
        return;
      }

      this.focusedJob = job;
      this.detailQueueJobDialogShown = true;
    },
    /**
     * Update a job in the list
     *
     * @param job The edited job
     */
    onJobEdited(job: AnyJob) {
      const index = this.jobs.findIndex(({ id }) => id === job.id);
      if (index <= -1) {
        return;
      }

      const jobs = [...this.jobs];
      jobs.splice(index, 1, job);
      this.jobs = jobs;
    },
  },
});
</script>

<style lang="scss" scoped>
.data-table::v-deep .v-data-table__wrapper {
  position: relative;
  cursor: pointer;
}
</style>

<i18n lang="yaml">
en:
  title: "{queue}'s jobs"
  refresh-tooltip: 'Refresh jobs list'
  headers:
    id: 'Id'
    status: 'Status'
    result: 'Is successful ?'
    added: 'Added'
    ended: 'Ended'
fr:
  title: 'Jobs de {queue}'
  refresh-tooltip: 'Rafraîchir la liste des jobs'
  headers:
    id: 'Id'
    status: 'Statut'
    result: 'A réussi ?'
    added: 'Ajouté le'
    ended: 'Fini le'
</i18n>
