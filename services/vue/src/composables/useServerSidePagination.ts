import type { ApiRequestOptions, SdkPaginated } from '~sdk';

type Options = {
  itemsPerPage?: number;
  sortBy?: string | undefined;
  order?: 'asc' | 'desc';
  filters?: Required<ApiRequestOptions>['filters'];
  include?: string[];
  immediate?: boolean;
};

export default function useServerSidePagination<T>(
  fetchFn: (params: ApiRequestOptions & { include?: string[] }) => Promise<SdkPaginated<T>>,
  opts: Options = {},
) {
  const items = ref<T[]>([]);
  const total = ref(0);

  const page = ref(1);
  const itemsPerPage = ref(opts.itemsPerPage || 10);
  const sortBy = ref<string | undefined>(opts.sortBy);
  const order = ref<'asc' | 'desc'>(opts.order || 'asc');

  const filters = ref<Required<ApiRequestOptions>['filters']>(opts.filters ?? {});

  const loading = ref(false);
  const error = ref<Error | undefined>(undefined);

  async function fetch() {
    loading.value = true;
    try {
      const { items: newItems, total: newTotal } = await fetchFn({
        include: opts.include,
        filters: filters.value,
        pagination: {
          count: itemsPerPage.value,
          page: page.value,
          sort: sortBy.value,
          order: order.value,
        },
      });

      items.value = newItems;
      total.value = newTotal;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(`${e}`);
    }
    loading.value = false;
  }

  function onPageChange(newPage: number) {
    page.value = newPage;
    fetch();
  }

  function onSortChange(sort: { key: string, order: 'asc' | 'desc' }[] | undefined) {
    sortBy.value = sort?.[0]?.key;
    order.value = sort?.[0]?.order ?? 'asc';
    fetch();
  }

  function onItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage.value = Math.max(newItemsPerPage, 0);
    fetch();
  }

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: items.value ?? [],
    loading: loading.value && 'primary',
    page: page.value,
    itemsLength: total.value,
    itemsPerPage: itemsPerPage.value === 0 ? -1 : itemsPerPage.value,
    sortBy: sortBy.value ? [{ key: sortBy.value, order: order.value }] : undefined,

    'onUpdate:page': onPageChange,
    'onUpdate:sortBy': onSortChange,
    'onUpdate:itemsPerPage': onItemsPerPageChange,
  }));

  if (opts.immediate !== false) {
    fetch();
  }

  debouncedWatch(
    filters,
    () => { fetch(); },
    { debounce: 500, deep: true },
  );

  return {
    filters,

    items: computed(() => items.value ?? []),
    total: computed(() => total.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    vDataTableOptions,

    refresh: () => fetch(),
  };
}
