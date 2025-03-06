export interface GeneralPermissions {
  [routeId: string]: boolean;
}

export interface NamespacePermissions {
  [namespaceId: string]: GeneralPermissions;
}

export interface UserPermissions {
  general: GeneralPermissions;
  namespaces: NamespacePermissions;
}
