# ezREEPORT

## Enums

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

### Task

A report task

| Property     | Type             | Description                                                                                                               | Attributes | Default  |
|--------------|------------------|---------------------------------------------------------------------------------------------------------------------------|------------|----------|
| id           | `String`         | Id of the report                                                                                                          | Id         | `uuid()` |
| name         | `String`         | The name of the report                                                                                                    |            |          |
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

| Property  | Type        | Description                                     | Attributes | Default  |
|-----------|-------------|-------------------------------------------------|------------|----------|
| id        | `String`    | The id of the template                          | Id         | `uuid()` |
| name      | `String`    | The name of the template                        | Unique     |          |
| tags      | `Json[]`    | Tags of the template                            |            |          |
| body      | `Json`      | The layouts used to generate the report         |            |          |
| createdAt | `DateTime`  | When the template was created                   |            | `now()`  |
| updatedAt | `DateTime?` | When the template was updated for the last time |            |          |
| tasks     | `Task[]`    | Tasks using template                            |            |          |
