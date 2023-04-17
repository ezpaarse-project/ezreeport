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

Methods used to manage crons, it should be only available to admins of ezREEPORT.

#### getAllCrons

```ts
getAllCrons(): Promise<ApiResponse<crons.Cron[]>>
```

Get all available crons and their statuses.

Needs `general.crons-get` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

#### getCron

```ts
getCron(name: string): Promise<ApiResponse<crons.Cron>>
```

Get more info about specific cron

Needs `general.crons-get-cron` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: The name of the cron

#### startCron

```ts
startCron(name: string): Promise<ApiResponse<crons.Cron>>
```

Start cron

Needs `general.crons-put-cron-start` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: The name of the cron

#### stopCron

```ts
stopCron(name: string): Promise<ApiResponse<crons.Cron>>
```

Stop cron

Needs `general.crons-put-cron-stop` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: The name of the cron

#### forceCron

```ts
forceCron(name: string): Promise<ApiResponse<crons.Cron>>
```

Force run of a cron

Needs `general.crons-post-cron-force` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: The name of the cron

---

### health

Methods used to monitor health of ezREEPORT.

#### getAllConnectedServices

```ts
type R = {
  current: string;
  currentVersion: string;
  services: health.PingResult['name'][];
};

getAllConnectedServices(): Promise<ApiResponse<R>>
```

Get all services connected to current service.

#### checkAllConnectedService

```ts
checkAllConnectedService(service: string): Promise<ApiResponse<health.PingResult>>
```

Check connection for all connected service from current service

__Params__:

- `service`: The name of the service

#### checkConnectedService

```ts
checkConnectedService(service: string): Promise<ApiResponse<health.PingResult>>
```

Check connection of a specific service from current service

__Params__:

- `service`: The name of the service

#### checkCurrentService

```ts
checkCurrentService(): Promise<ApiResponse<health.PingResult>>
```

Check connection of current service

It's useful when the app will have limited connection, or if you just want the processing time.

---

### namespaces

Only used for types.

---

### queues

Methods used to manage queues

#### getAllQueues

```ts
getAllQueues(): Promise<ApiResponse<queues.Queue[]>>
```

Get all available queues

Needs `general.queues-get` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

#### pauseQueue

```ts
pauseQueue(name: string): Promise<ApiResponse<queues.Queue>>
```

Pause specific queue

Needs `general.queues-put-queue-pause` permission(see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: Name of the queue

#### resumeQueue

```ts
resumeQueue(name: string): Promise<ApiResponse<queues.Queue>>
```


Restart specific queue

Needs `general.queues-put-queue-resume` permission(see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Params__:

- `name`: Name of the queue

#### getQueueJobs

```ts
getQueueJobs<Data, Result>(name: string): Promise<PaginatedApiResponse<queues.FullJob<Data, Result>[]>>
```

Get specific queue info

Needs `general.queues-get-queue-jobs` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Type Params__:

- `Data`: Data passed to the job (accessible with the `data` property)
- `Result`: Result returned by the job (accessible with the `result` property)

__Params__:

- `name`: Name of the queue

#### getJob

```ts
getJob<Data, Result>(name: string, jobId: string | number, namespaces?: string[]): Promise<ApiResponse<FullJob<Data, Result>>>
```

Get specific job info

Needs `namespaces[namespaceId].queues-get-queue-jobs-jobId` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)

__Type Params__:

- `Data`: Data passed to the job (accessible with the `data` property)
- `Result`: Result returned by the job (accessible with the `result` property)

__Params__:

- `name`: Name of the queue
- `jobId`: Id of the job
- `namespaces`: Ids of the namespace. Default to all possible namespaces.

#### retryJob

```ts
retryJob(): void
```

Retry job that failed

Needs `namespaces[namespaceId].queues-post-queue-jobs-jobId-retry` permission (see [auth::getCurrentPermissions](#getcurrentpermissions) for more info)


__Type Params__:

- `Data`: Data passed to the job (accessible with the `data` property)
- `Result`: Result returned by the job (accessible with the `result` property)

__Params__:

- `name`: Name of the queue
- `jobId`: Id of the job
- `namespaces`: Ids of the namespace. Default to all possible namespaces.

---

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