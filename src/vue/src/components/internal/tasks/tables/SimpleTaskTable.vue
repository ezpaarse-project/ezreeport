<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      class="data-table"
      item-key="id"
      hide-default-footer
    >
      <template #[`item.name`]="{ value: name, item: task }">
        <div>
          {{ name }}
        </div>

        <MiniTagsDetail :model-value="task.tags ?? []" />
      </template>

      <template #[`item.namespace`]="{ value: namespace }">
        <NamespaceRichListItem
          v-if="namespace"
          :namespace="namespace"
        />
        <v-progress-circular v-else indeterminate class="my-2" />
      </template>

      <template #[`item.recurrence`]="{ value: recurrence }">
        <div class="text-center">
          <RecurrenceChip
            :value="recurrence"
          />
        </div>
      </template>

      <template #[`item.enabled`]="{ value: enabled }">
        <v-chip v-if="enabled" color="success" outlined>
          <v-icon left>mdi-check-circle-outline</v-icon>
          {{ $t('$ezreeport.tasks.enabled.true') }}
        </v-chip>
        <v-chip v-else color="error" outlined>
          <v-icon left>mdi-close-circle-outline</v-icon>
          {{ $t('$ezreeport.tasks.enabled.false') }}
        </v-chip>
      </template>

      <template v-if="error" #[`body.append`]>
        <ErrorOverlay v-model="error" />
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import type { tasks, namespaces } from '@ezpaarse-project/ezreeport-sdk-js';
import type { DataTableHeader } from '~/types/vuetify';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

type TaskItem = {
  id: string,
  name: string,
  namespace?: namespaces.Namespace,
  recurrence: tasks.Recurrence,
  enabled: boolean,
  nextRun?: string,
};

export default defineComponent({
  props: {
    value: {
      type: Array as PropType<tasks.Task[]>,
      required: true,
    },
  },
  mixins: [ezReeportMixin],
  data: () => ({
    error: undefined as string | undefined,
  }),
  computed: {
    headers(): DataTableHeader<TaskItem>[] {
      return [
        {
          value: 'name',
          text: this.$t('$ezreeport.tasks.name').toString(),
        },
        {
          value: 'namespace',
          text: this.$ezReeport.tcNamespace(true),
          sort: (a?: namespaces.Namespace, b?: namespaces.Namespace) => (a?.name ?? '').localeCompare(b?.name ?? ''),
        },
        {
          value: 'recurrence',
          text: this.$t('$ezreeport.tasks.recurrence').toString(),
        },
        {
          value: 'enabled',
          text: this.$t('$ezreeport.tasks.status').toString(),
        },
        {
          value: 'nextRun',
          text: this.$t('$ezreeport.tasks.nextRun').toString(),
        },
      ];
    },
    namespaces(): namespaces.Namespace[] {
      return this.$ezReeport.data.namespaces.data;
    },
    items() {
      return this.value.map((task) => ({
        id: task.id,
        name: task.name,
        recurrence: task.recurrence,
        enabled: task.enabled,
        namespace: this.namespaces.find(({ id }) => task.namespaceId === id),
        nextRun: task.nextRun && task.enabled
          ? task.nextRun.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
          : undefined,
      }));
    },
  },
  mounted() {
    this.fetchNamespaces();
  },
  methods: {
    /**
     * Fetch namespaces
     */
    async fetchNamespaces() {
      try {
        this.$ezReeport.fetchNamespaces();
      } catch (error) {
        this.error = (error as Error).message;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.data-table::v-deep .v-data-table__wrapper {
  position: relative;
}
</style>
