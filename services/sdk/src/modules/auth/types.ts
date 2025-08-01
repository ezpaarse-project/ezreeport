export type GeneralPermissions = Record<string, boolean>;

export type NamespacePermissions = Record<string, GeneralPermissions>;

export interface UserPermissions {
  general: GeneralPermissions;
  namespaces: NamespacePermissions;
}
