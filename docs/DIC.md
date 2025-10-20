# ezREEPORT

## Enums

### GenerationStatus

Possible values of the status of a generation

| Value      |
|------------|
| PENDING    |
| PROCESSING |
| SUCCESS    |
| ERROR      |
| ABORTED    |

### Recurrence

Possible values for defining how often a report will be generated

| Value     |
|-----------|
| DAILY     |
| WEEKLY    |
| MONTHLY   |
| QUARTERLY |
| BIENNIAL  |
| YEARLY    |

### Access

Possible access level for memberships

| Value      |
|------------|
| READ       |
| READ_WRITE |
| SUPER_USER |

## Models

### Generation

A generation of a task

| Property      | Type               | Description                                       | Attributes | Default   |
|---------------|--------------------|---------------------------------------------------|------------|-----------|
| id            | `String`           | Id of the generation                              | Id         |           |
| task          | `Task`             | Task linked to the event                          |            |           |
| start         | `DateTime`         | Period start                                      |            |           |
| end           | `DateTime`         | Period end                                        |            |           |
| targets       | `String[]`         | Email adresses to send generated report           |            |           |
| origin        | `String`           | Origin of the generation                          |            |           |
| writeActivity | `Boolean`          | Should write activity in DB                       |            | `false`   |
| status        | `GenerationStatus` | Status of generation                              |            | `PENDING` |
| progress      | `Int?`             | Progress of generation                            |            |           |
| took          | `Int?`             | Number of milliseconds took to generate report    |            |           |
| reportId      | `String`           | Id of the generated report                        |            |           |
| createdAt     | `DateTime`         | When the generation was created/queued            |            | `now()`   |
| updatedAt     | `DateTime?`        | When the generation was updated for the last time |            |           |
| startedAt     | `DateTime?`        | When the generation was started                   |            |           |

### Task

A report task

| Property     | Type             | Description                                                                                                               | Attributes | Default  |
|--------------|------------------|---------------------------------------------------------------------------------------------------------------------------|------------|----------|
| id           | `String`         | Id of the report                                                                                                          | Id         | `uuid()` |
| name         | `String`         | The name of the report                                                                                                    |            |          |
| description  | `String`         | Description of the report                                                                                                 |            |          |
| namespace    | `Namespace`      | The "owner" of the report                                                                                                 |            |          |
| template     | `Json`           | The template used to generate the report                                                                                  |            |          |
| extends      | `Template`       |                                                                                                                           |            |          |
| lastExtended | `Json?`          | Last template extended by the report. If null then it's mean it's still linked. If set, extendedId must match default one |            |          |
| targets      | `String[]`       | Email adresses to send generated report                                                                                   |            |          |
| recurrence   | `Recurrence`     | Defines when the report will be generated                                                                                 |            |          |
| nextRun      | `DateTime`       | Next time the report will be generated                                                                                    |            |          |
| lastRun      | `DateTime?`      | Last time the report has been generated                                                                                   |            |          |
| enabled      | `Boolean`        | Is the generation of the report is enabled                                                                                |            | `true`   |
| activity     | `TaskActivity[]` | Activity of the task                                                                                                      |            |          |
| generations  | `Generation[]`   | Generation of the task                                                                                                    |            |          |
| createdAt    | `DateTime`       | When the report was created                                                                                               |            | `now()`  |
| updatedAt    | `DateTime?`      | When the report was updated for the last time                                                                             |            |          |

### TaskActivity

An activity event linked to a report (generation, edition, etc.)

| Property  | Type       | Description                      | Attributes | Default  |
|-----------|------------|----------------------------------|------------|----------|
| id        | `String`   | Id of the event                  | Id         | `uuid()` |
| task      | `Task`     | Task linked to the event         |            |          |
| type      | `String`   | Type of the event                |            |          |
| message   | `String`   | Message describing what happened |            |          |
| data      | `Json?`    | More data about what happened    |            |          |
| createdAt | `DateTime` | When the event occurred          |            | `now()`  |

### TaskPreset

Preset of a task used to quickly generate other tasks

| Property     | Type         | Description                                                                        | Attributes | Default  |
|--------------|--------------|------------------------------------------------------------------------------------|------------|----------|
| id           | `String`     | The id of the preset                                                               | Id         | `uuid()` |
| name         | `String`     | The name of the preset                                                             | Unique     |          |
| template     | `Template`   | The template linked to the preset                                                  |            |          |
| fetchOptions | `Json?`      | Specific options used when fetching data (when generating reports) for this preset |            |          |
| hidden       | `Boolean`    | Should the preset be hidden to users (except admins)                               |            | `false`  |
| recurrence   | `Recurrence` | Defines when the report will be generated                                          |            |          |
| createdAt    | `DateTime`   | When the preset was created                                                        |            | `now()`  |
| updatedAt    | `DateTime?`  | When the preset was updated for the last time                                      |            |          |

### RateLimit

Table to keep track of rate limits between nodes

| Property | Type        | Description | Attributes | Default |
|----------|-------------|-------------|------------|---------|
| source   | `String`    |             |            |         |
| route    | `String`    |             |            |         |
| count    | `Int?`      |             |            |         |
| ttl      | `DateTime?` |             |            |         |

### User

A user of ezREEPORT

| Property    | Type           | Description                                 | Attributes | Default |
|-------------|----------------|---------------------------------------------|------------|---------|
| username    | `String`       | The username of the user                    | Id         |         |
| token       | `String`       | Token used to identify user                 | Unique     |         |
| isAdmin     | `Boolean`      | Is the user an administrator of ezREEPORT   |            | `false` |
| memberships | `Membership[]` | Namespaces of the user                      |            |         |
| createdAt   | `DateTime`     | When the user was created                   |            | `now()` |
| updatedAt   | `DateTime?`    | When the user was updated for the last time |            |         |

### Membership

Link a User and a Namespace with given Access

| Property  | Type        | Description                                       | Attributes | Default |
|-----------|-------------|---------------------------------------------------|------------|---------|
| user      | `User`      | The User linked to the Namespace                  |            |         |
| namespace | `Namespace` | The Namespace linked to the User                  |            |         |
| access    | `Access`    | Access level of the user on this Namespace        |            |         |
| createdAt | `DateTime`  | When the membership was created                   |            | `now()` |
| updatedAt | `DateTime?` | When the membership was updated for the last time |            |         |

### Namespace

A namespace for grouping users and reports

| Property     | Type           | Description                                                                               | Attributes | Default |
|--------------|----------------|-------------------------------------------------------------------------------------------|------------|---------|
| id           | `String`       | The id of the namespace                                                                   | Id         |         |
| name         | `String`       | The name of the namespace                                                                 |            |         |
| fetchLogin   | `Json`         | Specific credentials used when fetching data (when generating reports) for this namespace |            |         |
| fetchOptions | `Json`         | Specific options used when fetching data (when generating reports) for this namespace     |            |         |
| logoId       | `String?`      | Id of the logo of the namespace                                                           |            |         |
| memberships  | `Membership[]` | Members of the namespaces                                                                 |            |         |
| tasks        | `Task[]`       | Reports of the namespace                                                                  |            |         |
| createdAt    | `DateTime`     | When the namespace was created                                                            |            | `now()` |
| updatedAt    | `DateTime?`    | When the namespace was updated for the last time                                          |            |         |

### Template

Base template used by reports

| Property  | Type           | Description                                            | Attributes | Default  |
|-----------|----------------|--------------------------------------------------------|------------|----------|
| id        | `String`       | The id of the template                                 | Id         | `uuid()` |
| name      | `String`       | The name of the template                               | Unique     |          |
| hidden    | `Boolean`      | Should the template be hidden to users (except admins) |            | `false`  |
| tags      | `Json[]`       | Tags of the template                                   |            |          |
| body      | `Json`         | The layouts used to generate the report                |            |          |
| createdAt | `DateTime`     | When the template was created                          |            | `now()`  |
| updatedAt | `DateTime?`    | When the template was updated for the last time        |            |          |
| tasks     | `Task[]`       | Tasks using template                                   |            |          |
| presets   | `TaskPreset[]` | Presets using template                                 |            |          |
