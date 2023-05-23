# ezREEPORT

## Enums

### Recurrence

| Value     |
|-----------|
| DAILY     |
| WEEKLY    |
| MONTHLY   |
| QUARTERLY |
| BIENNIAL  |
| YEARLY    |

### Access

| Value      |
|------------|
| READ       |
| READ_WRITE |
| SUPER_USER |

## Models

### Task

| Property    | Type       | Description | Attributes |
|-------------|------------|-------------|------------|
| id          | String     |             | Id         |
| name        | String     |             |            |
| namespaceId | String     |             | Readonly   |
| namespace   | Namespace  |             |            |
| template    | Json       |             |            |
| targets     | String[]   |             |            |
| recurrence  | Recurrence |             |            |
| nextRun     | DateTime   |             |            |
| lastRun     | DateTime   |             |            |
| enabled     | Boolean    |             |            |
| history     | History[]  |             |            |
| createdAt   | DateTime   |             |            |
| updatedAt   | DateTime   |             |            |

### History

| Property  | Type     | Description | Attributes |
|-----------|----------|-------------|------------|
| id        | String   |             | Id         |
| task      | Task     |             |            |
| taskId    | String   |             | Readonly   |
| type      | String   |             |            |
| message   | String   |             |            |
| data      | Json     |             |            |
| createdAt | DateTime |             |            |

### User

| Property    | Type         | Description | Attributes |
|-------------|--------------|-------------|------------|
| username    | String       |             | Id         |
| token       | String       |             | Unique     |
| isAdmin     | Boolean      |             |            |
| memberships | Membership[] |             |            |
| createdAt   | DateTime     |             |            |
| updatedAt   | DateTime     |             |            |

### Membership

| Property    | Type      | Description | Attributes |
|-------------|-----------|-------------|------------|
| username    | String    |             | Readonly   |
| user        | User      |             |            |
| namespaceId | String    |             | Readonly   |
| namespace   | Namespace |             |            |
| access      | Access    |             |            |
| createdAt   | DateTime  |             |            |
| updatedAt   | DateTime  |             |            |

### Namespace

| Property     | Type         | Description | Attributes |
|--------------|--------------|-------------|------------|
| id           | String       |             | Id         |
| name         | String       |             |            |
| fetchLogin   | Json         |             |            |
| fetchOptions | Json         |             |            |
| logoId       | String       |             |            |
| memberships  | Membership[] |             |            |
| tasks        | Task[]       |             |            |
| createdAt    | DateTime     |             |            |
| updatedAt    | DateTime     |             |            |

### Template

| Property  | Type     | Description | Attributes |
|-----------|----------|-------------|------------|
| name      | String   |             | Id         |
| tags      | Json[]   |             |            |
| body      | Json     |             |            |
| createdAt | DateTime |             |            |
| updatedAt | DateTime |             |            |
