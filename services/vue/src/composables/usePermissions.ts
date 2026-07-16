import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';

type Params = Parameters<typeof hasPermission>;

// oxlint-disable-next-line no-default-export
export default function usePermissions<Key extends string>(
  actions: MaybeRefOrGetter<Record<Key, Params>>
): { availableActions: ComputedRef<Record<Key, boolean>> } {
  const arePermissionsReady = shallowRef(false);

  const availableActions = computed(() => {
    const entries = Object.entries(toValue(actions)) as [Key, Params][];

    const resolved = entries.map(([key, params]) => [
      key,
      arePermissionsReady.value ? hasPermission(...params) : false,
    ]);

    return Object.fromEntries(resolved) as Record<Key, boolean>;
  });

  async function loadPermissions(): Promise<void> {
    try {
      await refreshPermissions();
      arePermissionsReady.value = true;
    } catch {
      arePermissionsReady.value = false;
    }
  }

  void loadPermissions();

  return { availableActions };
}
