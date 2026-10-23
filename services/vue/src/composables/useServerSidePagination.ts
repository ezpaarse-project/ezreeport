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
  const total = shallowRef(0);

  const page = shallowRef(1);
  const itemsPerPage = isRef(opts.itemsPerPage)
    ? opts.itemsPerPage
    : shallowRef(opts.itemsPerPage ?? 10);

  const sortBy = shallowRef<string | undefined>(opts.sortBy);
  const order = shallowRef<'asc' | 'desc'>(opts.order || 'asc');

  const filters = ref<Required<ApiRequestOptions>['filters']>(
    opts.filters ?? {}
  );

  const loading = shallowRef(false);
  const err = ref<Error | undefined>(undefined);

  async function fetch(): Promise<void> {
    loading.value = true;
    try {
      const { items: newItems, total: newTotal } = await fetchFn({
        filters: filters.value,
        include: opts.include,
        pagination: {
          count: Math.max(itemsPerPage.value, 0),
          order: order.value,
          page: page.value,
          sort: sortBy.value,
        },
      });

      items.value = newItems;
      total.value = newTotal;
    } catch (error) {
      err.value = error instanceof Error ? error : new Error(`${error}`);
    }
    loading.value = false;
  }

  async function onPageChange(newPage: number): Promise<void> {
    page.value = newPage;

    await nextTick();
    await fetch();
  }

  async function onSortChange(
    sort: { key: string; order: 'asc' | 'desc' }[] | undefined
  ): Promise<void> {
    sortBy.value = sort?.[0]?.key;
    order.value = sort?.[0]?.order ?? 'asc';

    await nextTick();
    await fetch();
  }

  async function onItemsPerPageChange(newItemsPerPage: number): Promise<void> {
    itemsPerPage.value = newItemsPerPage;

    await nextTick();
    await fetch();
  }

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: items.value ?? [],
    itemsLength: total.value,
    itemsPerPage: itemsPerPage.value,
    itemsPerPageOptions: opts.itemsPerPageOptions,
    loading: loading.value && 'primary',
    'onUpdate:itemsPerPage': onItemsPerPageChange,
    'onUpdate:page': onPageChange,
    'onUpdate:sortBy': onSortChange,
    page: page.value,
    sortBy: sortBy.value
      ? [{ key: sortBy.value, order: order.value }]
      : undefined,
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
    error: computed(() => err.value),

    filters,

    items: computed(() => items.value ?? []),

    loading: computed(() => loading.value),

    refresh: () => fetch(),

    total: computed(() => total.value),

    vDataTableOptions,
  };
}
