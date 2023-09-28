<template>
  <div v-if="value.length > 0">
    <ElasticAggElementDialog
      v-if="selectedAggElement"
      v-model="elementDialogShown"
      :element="selectedAggElement"
      :element-index="selectedIndex"
      :readonly="readonly"
      :used-names="usedNames"
      @update:element="onElementEdited"
      @update:loading="onElementLoading"
    />

    <v-list dense rounded>
      <v-list-item
        v-for="(item, i) in items"
        :key="item.name"
        :close="!readonly"
        @click="openDialog(i)"
      >
        <v-list-item-action v-if="!readonly">
          <v-btn
            :loading="loadingMap[item.name]"
            icon
            small
            @click="!readonly && onElementDeleted(i)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>

        <v-list-item-content>
          <v-list-item-title>{{ item.name }}</v-list-item-title>

          <i18n tag="v-list-item-subtitle" path="$ezreeport.fetchOptions.aggSummary" class="font-weight-light text--secondary">
            <template #type>
              <span class="font-weight-medium">
                {{ item.type }}
              </span>
            </template>

            <template #field>
              <span class="font-weight-medium">
                {{ item.field }}
              </span>
            </template>
          </i18n>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { getTypeFromAgg } from '~/lib/elastic/aggs';

export default defineComponent({
  props: {
    /**
     * Aggregations
     */
    value: {
      type: Array as PropType<Record<string, any>[]>,
      required: true,
    },
    /**
     * Should be readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    /**
     * Triggered on any change in aggregations
     *
     * @param val The new aggregations
     */
    input: (val: Record<string, any>[]) => !!val,
  },
  data: () => ({
    elementDialogShown: false,

    loadingMap: {} as Record<string, boolean>,
    selectedIndex: -1,
  }),
  computed: {
    /**
     * Currently selected agg element
     */
    selectedAggElement(): Record<string, any> | undefined {
      return this.value[this.selectedIndex];
    },
    /**
     * Values with localized info
     */
    items() {
      return this.value.map((agg, i) => {
        const type = getTypeFromAgg(agg);

        return {
          name: agg.name || `agg${i}`,
          type: this.$t(type ? `$ezreeport.fetchOptions.agg_types.${type}` : '$ezreeport.unknown'),
          field: agg[type || '']?.field || 'unknown',
        };
      });
    },
    /**
     * Used names by aggregations
     */
    usedNames(): string[] {
      return this.items.map((agg) => agg.name);
    },
  },
  methods: {
    /**
     * Prepare and open element dialog
     *
     * @param index the index of chip
     * @param event The base event
     */
    async openDialog(i: number) {
      this.selectedIndex = i;
      await this.$nextTick();
      this.elementDialogShown = true;
    },
    /**
     * Update agg value when a element is created
     *
     * Note: called by parent via ref
     */
    async onElementCreated() {
      const newIndex = this.value.length;
      this.$emit('input', [...this.value, { name: `agg${newIndex}` }]);
      await this.$nextTick();
      this.openDialog(newIndex);
    },
    /**
     * Update agg value when a element is edited
     *
     * @param index The index
     * @param element The element
     */
    onElementEdited(index: number, element: Record<string, any>) {
      const elements = [...this.value];
      elements.splice(index, 1, element);
      this.$emit('input', elements);
    },
    /**
     * Update agg value when a element is deleted
     *
     * @param index The index
     */
    onElementDeleted(index: number) {
      const elements = [...this.value];
      elements.splice(index, 1);
      this.$emit('input', elements);
    },
    /**
     * Notify that an item is loading
     *
     * @param loading
     */
    onElementLoading(loading: boolean) {
      const key = this.selectedAggElement?.name || `agg${this.selectedIndex}`;
      this.loadingMap = {
        ...this.loadingMap,
        [key]: loading,
      };
    },
  },
});
</script>

<style scoped>

</style>
