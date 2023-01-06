<template>
  <div>
    <LoadingToolbar
      text="Status"
      :loading="loading"
    >
      <v-btn
        icon
        :disabled="loading || !!mock"
        @click="fetch"
      >
        <v-progress-circular
          v-if="loading"
          size="20"
          width="2"
          indeterminate
        />
        <v-icon v-else>
          mdi-refresh
        </v-icon>
      </v-btn>
    </LoadingToolbar>

    <v-list style="position: relative;">
      <v-list-item
        v-for="status in statuses"
        :key="status.name"
      >
        <v-list-item-content>
          <v-list-item-title class="d-flex align-center">
            <div>{{ status.name }}</div>

            <v-spacer />

            <v-tooltip
              top
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

      <v-fade-transition>
        <v-overlay
          v-if="error"
          :color="errorColor"
          absolute
        >
          {{ error }}
        </v-overlay>
      </v-fade-transition>
    </v-list>
  </div>
</template>

<script lang="ts">
import { health } from 'reporting-sdk-js';
import { defineComponent, type PropType } from 'vue';
import colors from 'vuetify/es5/util/colors';

interface StatusItem {
  name: string,
  color: string,
  text: 'OK' | 'KO',
  tooltip: string,
}

interface Mock {
  data?: health.PingResult[],
  error?: string,
  loading?: boolean
}

export default defineComponent({
  props: {
    mock: {
      type: Object as PropType<Mock | undefined>,
      default: undefined,
    },
  },
  data: () => ({
    loading: false,
    statuses: [] as StatusItem[],
    error: '',
    errorColor: colors.red.darken4,
  }),
  mounted() {
    if (this.mock) {
      this.statuses = (this.mock.data ?? []).map(this.pingResultToStatusItem);
      this.error = this.mock.error ?? '';
      this.loading = this.mock.loading ?? false;
    } else {
      this.fetch();
    }
  },
  methods: {
    async fetch() {
      this.loading = true;
      try {
        const { content } = await health.checkAllConnectedService();
        this.statuses = content.map(this.pingResultToStatusItem);
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    pingResultToStatusItem(ping: health.PingResult): StatusItem {
      return {
        name: ping.name,
        color: ping.status ? 'green' : 'red',
        text: ping.status ? 'OK' : 'KO',
        tooltip: ping.status ? `${ping.elapsedTime}ms (${ping.statusCode})` : ping.error,
      };
    },
  },
});
</script>

<style scoped>

</style>
