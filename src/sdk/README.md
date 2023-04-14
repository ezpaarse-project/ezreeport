# ezREEPORT-sdk-js

> SDK used to interact with ezREEPORT API

## Features

- ✅ User requests
- ✅ Follow generation of report
- ✅ Automatic parsing (dates, enums, etc.)
- ❌ Admin requests (the ones that need API key)

## Modules

- [auth](#auth)
- [setup](#setup)

### auth

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
#### getCurrentPermissions
#### getCurrentNamespaces

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