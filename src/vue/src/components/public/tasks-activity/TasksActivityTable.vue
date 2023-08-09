<template>
  <v-col v-if="perms.readAll">
    <v-row>
      <v-col>
        <NamespaceSelect
          v-model="currentNamespace"
          @input="fetch()"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <LoadingToolbar :text="$t('title').toString()">
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />
        </LoadingToolbar>

        <InternalTaskActivityTable
          :activity="tasksActivity"
          :options="options"
          class="tasksActivity-table"
        />

        <v-data-footer
          :items-per-page-options="[5, 10, 15]"
          :options.sync="footerOptions"
          :pagination="footerPagination"
        />
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import type { tasksActivity } from '@ezpaarse-project/ezreeport-sdk-js';
import { type PropType, defineComponent } from 'vue';
import { DataOptions, DataPagination } from 'vuetify';
import ezReeportMixin from '~/mixins/ezr';

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    /**
     * How often the entries are re-fetched in ms
     */
    fetchInterval: {
      type: [Number, Boolean] as PropType<number | false>,
      default: 5000,
    },
  },
  data: () => ({
    interval: undefined as NodeJS.Timer | undefined,

    options: {
      sortBy: ['date'],
      sortDesc: [true],
      itemsPerPage: -1,
    } as DataOptions,
    paginationData: {
      page: 1,
      itemsPerPage: 15,
      itemsLength: 0,
    },
    lastIds: {} as Record<number, string | undefined>,

    currentNamespace: '',
    tasksActivity: [] as tasksActivity.ActivityWithTask[],

    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      return {
        readAll: has('tasksActivity-get', []),
      };
    },
    footerOptions: {
      get(): DataOptions {
        return {
          page: this.paginationData.page,
          itemsPerPage: this.paginationData.itemsPerPage,
          sortBy: [''],
          sortDesc: [false],
          groupBy: [''],
          groupDesc: [false],
          multiSort: false,
          mustSort: false,
        };
      },
      set(val: DataOptions) {
        this.paginationData.itemsPerPage = val.itemsPerPage;
        this.fetch(val.page);
      },
    },
    footerPagination(): DataPagination {
      return {
        page: this.paginationData.page,
        itemsPerPage: this.paginationData.itemsPerPage,
        pageStart: (this.paginationData.page - 1) * this.paginationData.itemsPerPage,
        pageStop: this.paginationData.page * this.paginationData.itemsPerPage,
        pageCount: this.paginationData.itemsPerPage,
        itemsLength: this.paginationData.itemsLength,
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': function () {
      this.fetch();
    },
    fetchInterval() {
      this.stopAutoFetch();
      this.startAutoFetch();
    },
  },
  mounted() {
    this.fetch();
    this.startAutoFetch();
  },
  destroyed() {
    this.stopAutoFetch();
  },
  unmounted() {
    this.stopAutoFetch();
  },
  methods: {
    startAutoFetch() {
      if (this.fetchInterval && !Number.isNaN(this.fetchInterval)) {
        this.interval = setInterval(() => this.fetch(), this.fetchInterval);
      }
    },
    stopAutoFetch() {
      clearInterval(this.interval);
    },
    /**
     * Fetch tasks and parse result
     *
     * @param page The page to fetch, if not present it default to current page
     */
    async fetch(page?:number) {
      if (!page) {
        // eslint-disable-next-line no-param-reassign
        page = this.paginationData.page;
      }

      if (this.perms.readAll) {
        this.loading = true;
        try {
          // TODO: sort (not supported by API)
          const { content, meta } = await this.$ezReeport.sdk.tasksActivity.getAllEntries(
            {
              previous: this.lastIds[page - 1],
              count: this.paginationData.itemsPerPage,
            },
            this.currentNamespace ? [this.currentNamespace] : [],
          );
          if (!content) {
            throw new Error(this.$t('$ezreeport.errors.fetch').toString());
          }

          this.tasksActivity = content;
          this.paginationData.page = page;
          this.paginationData.itemsLength = meta.total;

          const lastIds = { ...this.lastIds };
          lastIds[page] = meta.lastId as string | undefined;
          this.lastIds = lastIds;
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      } else {
        this.tasksActivity = [];
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.tasksActivity-table::v-deep .v-data-table {
  border-top-left-radius: 0;
    border-top-right-radius: 0;
}
</style>

<i18n lang="yaml">
en:
  title: 'Activity of periodic reports'
  refresh-tooltip: 'Refresh activity'
fr:
  title: 'Activité des rapports périodiques'
  refresh-tooltip: "Rafraîchir l'activité"
</i18n>
