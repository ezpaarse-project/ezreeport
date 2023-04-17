# ezREEPORT-sdk-js

> SDK used to interact with ezREEPORT API

## Features

- ✅ User requests
- ✅ Follow generation of report
- ✅ Automatic parsing (dates, enums, etc.)
- ❌ Admin requests (the ones that need API key)

---
---

## Modules

- [auth](#auth)
- [setup](#setup)

All responses use the `ApiResponse` or `PaginatedApiResponse` types which refer to this :

```ts
interface ApiResponse<T> {
  /**
   * HTTP Status
   */
  status: {
    code: number,
    message: string,
  },
  /**
   * Content of the response
   */
  content: T
}

interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: {
    /**
     * Count of items in response
     */
    count: number,
    /**
     * Count of items wanted
     */
    size: number,
    /**
     * Count of items available
     */
    total: number,
    /**
     * Id of last item in response
     */
    lastId?: unknown
  }
}

```

---

### auth

Methods used to interact with current user

#### login

```ts
login(token: string): void
```

Set the given token into axios

#### logout

```ts
logout(): void
```

Unset any token from axios

#### isLogged

```ts
isLogged(): boolean
```

Check if any token is in axios. **DOESN'T CHECK IF TOKEN IS VALID !**

#### getCurrentUser

```ts
getCurrentUser(): Promise<ApiResponse<auth.User>>
```

Get info about logged user

#### getCurrentPermissions

```ts
getCurrentPermissions(): Promise<ApiResponse<auth.Permissions>>
```

Get permissions of logged user.

There a 2 types of permissions :

- Namespaced: Those ones depends from a namespace to another. If a namespace is not in the list, then the current user doesn't have access to this namespace.
- General: Those ones are global to ezREEPORT and doesn't depends on namespace.

#### getCurrentNamespaces

```ts
getCurrentNamespaces(): Promise<ApiResponse<namespaces.Namespace[]>>
```

Get accessible namespaces by logged user. It should returns the same namespaces as [auth::getCurrentPermissions](#getcurrentpermissions) but with more info about namespaces.

---
### crons
#### getAllCrons
#### getCron

### health
#### getAllConnectedServices
#### checkAllConnectedService
#### checkConnectedService
#### checkCurrentService

### namespaces

### queues
#### getAllQueues
#### pauseQueue
#### resumeQueue
#### getQueueJobs
#### getJob
#### retryJob

### reports
#### startGeneration
#### startAndListenGeneration
#### getReportFileByName
#### getReportFileByJob
#### getReportDetailByName
#### getReportDetailByJob
#### getReportDebugByName
#### getReportDebugByJob

### setup

#### setURL
#### unsetURL
#### isURLset

#### login

Same as in [auth module](#auth)

#### logout

Same as in [auth module](#auth)

#### isLogged

Same as in [auth module](#auth)

### tasks

#### getAllTasks
#### getTask
#### createTask
#### updateTask
#### deleteTask
#### enableTask
#### disableTask

### templates

#### getAllTemplates
#### getTemplate
#### createTemplate
#### updateTemplate
#### deleteTemplate