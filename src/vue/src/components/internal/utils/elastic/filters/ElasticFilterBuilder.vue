<template>
  <div v-if="filterChips.length > 0">
    <ElasticFilterElementPopover
      v-if="selectedFilterElement"
      v-model="elementPopoverShown"
      :coords="elementPopoverCoords"
      :element="selectedFilterElement"
      :used-raws="usedRaws"
      :mapping=mapping
      :readonly="readonly"
      @update:element="onElementEdited"
    />

    <v-chip-group column>
      <v-chip
        v-for="(item, i) in filterChips"
        :key="item.key"
        :color="item.type"
        :close="!readonly"
        label
        outlined
        @click="openPopover(i, $event)"
        @click:close="!readonly && onElementDeleted(item)"
      >
        <i18n :path="item.i18n" tag="span">
          <template #key>
            <span class="text--primary font-italic">
              {{ item.data.key }}
            </span>
          </template>

          <template #value>
            <span class="text--primary">
              {{ item.data.value }}
            </span>
          </template>

        </i18n>
      </v-chip>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import { type PropType, defineComponent } from 'vue';
import type { FilterElement } from './ElasticFilterElementPopover.vue';

interface FilterChip {
  key: string;
  type: string;
  i18n: string;
  data: {
    key: string;
    value: string;
  };
}

export default defineComponent({
  props: {
    value: {
      type: Object,
      required: true,
    },
    mapping: {
      type: Array as PropType<{ key: string, type: string }[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      required: false,
    },
  },
  emits: {
    input: (val: Record<string, any>) => !!val,
  },
  data: () => ({
    elementPopoverShown: false,
    elementPopoverCoords: { x: 0, y: 0 },

    selectedIndex: -1,
  }),
  computed: {
    /**
     * Extract values and some info from Elastic query (value)
     */
    filterElements: {
      get() {
        const elements: FilterElement[] = [
          ...(this.value.filter ?? []).map((filter: any) => this.elasticToElement(filter, '')),
          ...(this.value.must_not ?? []).map((filter: any) => this.elasticToElement(filter, 'NOT')),
        ].filter((v: any) => v !== undefined);
        return elements.sort((a, b) => a.key.localeCompare(b.key));
      },
      set(elements: FilterElement[]) {
        const query = {
          filter: [] as Record<string, any>[],
          must_not: [] as Record<string, any>[],
        };

        // eslint-disable-next-line no-restricted-syntax
        for (const element of elements) {
          const filter = this.elementToElastic(element);

          if (element) {
            // Add filter to query
            switch (element.modifier) {
              case 'NOT':
                query.must_not.push(filter);
                break;

              default:
                query.filter.push(filter);
                break;
            }
          }
        }

        this.$emit('input', query);
      },
    },
    /**
     * Parse filters elements into data for chips
     */
    filterChips(): FilterChip[] {
      return this.filterElements.map((item) => {
        let type = 'info';
        switch (item.modifier) {
          case 'NOT':
            type = 'error';
            break;

          default:
            break;
        }

        const operator = item.values.length > 1 ? 'IN' : item.operator;
        return {
          key: item.raw,
          type,
          i18n: `operatorsFormatters.${operator}_${item.modifier}`,
          data: {
            key: item.key,
            value: item.values.join(', '),
          },
        };
      });
    },
    /**
     * Currently selected filter element
     */
    selectedFilterElement(): FilterElement {
      return this.filterElements[this.selectedIndex] || { values: [] };
    },
    usedRaws(): string[] {
      return this.filterElements.map(({ raw }) => raw);
    },
  },
  methods: {
    /**
     * Transform raw elastic filter into a usable element
     *
     * @param filter Raw elastic filter
     * @param modifier Modifier of the filter
     *
     * @returns undefined if not supported
     */
    elasticToElement(filter: any, modifier: FilterElement['modifier']): FilterElement | undefined {
      const res = {
        raw: '',
        modifier,
        operator: '',
        key: '',
        values: [] as any[],
      };

      const keys = Object.keys(filter);
      if (keys.length !== 1) {
        return undefined;
      }

      // Gets operator of filter
      switch (keys[0]) {
        case 'exists': {
          res.operator = 'EXISTS';
          res.key = filter.exists.field;
          break;
        }

        case 'match_phrase': {
          res.operator = 'IS';
          const fields = Object.keys(filter.match_phrase);
          if (fields.length !== 1) {
            return undefined;
          }
          // eslint-disable-next-line prefer-destructuring
          res.key = fields[0];
          res.values = [filter.match_phrase[fields[0]]];
          break;
        }

        case 'bool': {
          res.operator = 'IS';
          const subElements: FilterElement[] = (filter.bool.should ?? [])
            .map((f: any) => this.elasticToElement(f, modifier))
            .filter((v: any) => v !== undefined);

          const subElementsKeys = subElements.map(({ key }) => key);
          const keySet = new Set(subElementsKeys);
          if (keySet.size !== 1) {
            return undefined;
          }

          // eslint-disable-next-line prefer-destructuring
          res.key = subElementsKeys[0];
          res.values = subElements.map(({ values }) => values).flat();
          break;
        }

        default:
          return undefined;
      }
      res.raw = `${res.key}.${res.operator}`;

      return res as FilterElement;
    },
    /**
     * Transform usable element into raw elastic filter
     *
     * @param element Usable element
     *
     * @returns undefined if not supported
     */
    elementToElastic(element: Omit<FilterElement, 'raw'>): any {
      switch (element.operator) {
        case 'EXISTS':
          return { exists: { field: element.key } };

        case 'IS':
          if (element.values.length <= 1) {
            return { match_phrase: { [element.key]: element.values[0] } };
          }
          return {
            bool: {
              should: element.values.map(
                (v) => this.elementToElastic({
                  key: element.key,
                  modifier: '',
                  operator: 'IS',
                  values: [v],
                }),
              ),
            },
          };

        default:
          return undefined;
      }
    },
    /**
     * Prepare and open element popover
     *
     * @param index the index of chip
     * @param event The base event
     */
    async openPopover(i: number, event: MouseEvent) {
      this.selectedIndex = i;
      this.elementPopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.elementPopoverShown = true;
    },
    /**
     * Update filter value when a element is edited
     *
     * @param element The element
     */
    async onElementEdited(element: FilterElement) {
      const elements = [...this.filterElements];
      const index = elements.findIndex(({ raw }) => element.raw === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1, element);
      this.filterElements = elements;

      // Update current
      await this.$nextTick();
      const newIndex = this.filterElements.findIndex(({ raw }) => `${element.key}.${element.operator}` === raw);
      if (newIndex < 0) {
        this.elementPopoverShown = false;
      }
      this.selectedIndex = newIndex;
    },
    /**
     * Update filter value when a chip is deleted
     *
     * @param chip The chip
     */
    onElementDeleted(chip: FilterChip) {
      const elements = [...this.filterElements];
      const index = elements.findIndex(({ raw }) => chip.key === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1);
      this.filterElements = elements;
    },
    /**
     * Update filter value when a element is created
     *
     * Note: called by parent via ref
     */
    onElementCreated() {
      const elements = [...this.filterElements];

      const index = elements.length;
      const el: Omit<FilterElement, 'raw'> = {
        key: `field-${index}`,
        modifier: '',
        operator: 'EXISTS',
        values: [],
      };

      elements.push(el as FilterElement);
      this.filterElements = elements;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  operatorsFormatters:
    IS_: '{key} is {value}'
    IS_NOT: '{key} is not {value}'
    IN_: '{key} is in {value}'
    IN_NOT: '{key} is not in {value}'
    EXISTS_: '{key} exist'
    EXISTS_NOT: "{key} doesn't exist"
fr:
  operatorsFormatters:
    IS_: '{key} est {value}'
    IS_NOT: "{key} n'est pas {value}"
    IN_: '{key} est inclus dans {value}'
    IN_NOT: "{key} n'est pas inclus dans {value}"
    EXISTS_: '{key} existe'
    EXISTS_NOT: "{key} n'existe pas"
</i18n>
