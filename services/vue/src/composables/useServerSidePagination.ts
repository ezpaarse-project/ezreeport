import type { ApiRequestOptions, SdkPaginated } from '~sdk';

type Options = {
  itemsPerPage?: MaybeRef<number>;
  itemsPerPageOptions?: number[] | { title: string; value: number }[];
  sortBy?: string | undefined;
  order?: 'asc' | 'desc';
  filters?: Required<ApiRequestOptions>['filters'];
  include?: string[];
  immediate?: boolean;
};

export default function useServerSidePagination<DataType>(
  fetchFn: (
    params: ApiRequestOptions & { include?: string[] }
  ) => Promise<SdkPaginated<DataType>>,
  opts: Options = {}
) {
  const items = ref<DataType[]>([]);
  const total = ref(0);

  const page = ref(1);
  const itemsPerPage = isRef(opts.itemsPerPage)
    ? opts.itemsPerPage
    : ref(opts.itemsPerPage ?? 10);

  const sortBy = ref<string | undefined>(opts.sortBy);
  const order = ref<'asc' | 'desc'>(opts.order || 'asc');

  const filters = ref<Required<ApiRequestOptions>['filters']>(
    opts.filters ?? {}
  );

  const loading = ref(false);
  const error = ref<Error | undefined>(undefined);

  async function fetch() {
    loading.value = true;
    try {
      const { items: newItems, total: newTotal } = await fetchFn({
        include: opts.include,
        filters: filters.value,
        pagination: {
          count: Math.max(itemsPerPage.value, 0),
          page: page.value,
          sort: sortBy.value,
          order: order.value,
        },
      });

      items.value = newItems;
      total.value = newTotal;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(`${err}`);
    }
    loading.value = false;
  }

  async function onPageChange(newPage: number) {
    page.value = newPage;

    await nextTick();
    return fetch();
  }

  async function onSortChange(
    sort: { key: string; order: 'asc' | 'desc' }[] | undefined
  ) {
    sortBy.value = sort?.[0]?.key;
    order.value = sort?.[0]?.order ?? 'asc';

    await nextTick();
    return fetch();
  }

  async function onItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage.value = newItemsPerPage;

    await nextTick();
    return fetch();
  }

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: items.value ?? [],
    loading: loading.value && 'primary',
    page: page.value,
    itemsLength: total.value,
    itemsPerPage: itemsPerPage.value,
    itemsPerPageOptions: opts.itemsPerPageOptions,
    sortBy: sortBy.value
      ? [{ key: sortBy.value, order: order.value }]
      : undefined,

    'onUpdate:page': onPageChange,
    'onUpdate:sortBy': onSortChange,
    'onUpdate:itemsPerPage': onItemsPerPageChange,
  }));

  if (opts.immediate !== false) {
    fetch();
  }

  debouncedWatch(
    filters,
    () => {
      fetch();
    },
    { debounce: 500, deep: true }
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
