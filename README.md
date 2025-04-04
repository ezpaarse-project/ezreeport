# ezReeport

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)
* [pnpm](https://pnpm.io/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezreeport.git
cd ezreeport
echo 'ELASTIC_URL="${ELASTIC_SCHEME:-https}://${ELASTIC_HOST}:${ELASTIC_PORT:-9200}"\n\nDATABASE_URL="${DATABASE_PROTOCOL:-postgresql}://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=default"' > .env.local
corepack enable
pnpm i --frozen-lockfile
```

## Start ezREEPORT

### Migrate database

```bash
docker compose -f ezreeport/docker-compose.migrate.yml up -d
docker compose -f ezreeport/docker-compose.migrate.yml wait api
# If you want to see what happened, or if wait returned a non-0 exit code :
docker compose -f ezreeport/docker-compose.migrate.yml logs api
docker compose -f ezreeport/docker-compose.migrate.yml down
```

### Production mode

```bash
docker compose -f docker-compose.yml pull
# Apply database migrations, see previous part
docker compose -f docker-compose.yml up -d
```

### Development mode

```bash
docker compose -f docker-compose.debug.yml pull
# Apply database migrations, see previous part
docker compose -f docker-compose.debug.yml up -d
```

## Contributions

### Main workflow

Workflow used here is the same as Git Flow :

- To make new changes : create a `feature/*` branch
- Once feature is completed, make a [Pull Request](https://github.com/ezpaarse-project/ezreeport/compare) from your branch to the `dev` branch
- Once a new version is ready, create a new `rc/*` branch and make a (draft) PR to the `master` branch
- Once the new version is deployed, merge the PR

## Components

### Services

- `services/report`: (ezreeport-report)
  - Manage templates with HTTP API
- `services/worker`
  - Generate PDF reports
- `services/scheduler`
  - Cronjob to generate reports
- `services/mail`: (ezreeport-mail)
  - Handle email management


### Packages

- `services/common` (not public)
  - Various functions and types to use across repository
- `services/cli/ezra` (@ezpaarse-project/ezreeport-admin)
  - CLI client for managing ezREEPORT instances
- `services/sdk` (@ezpaarse-project/ezreeport-sdk-js)
  - SDK for ezREEPORT API
- `services/vue` (@ezpaarse-project/ezreeport-vue)
  - Vue components that use SDK for displaying info

### Inter dependencies between components

Some components are depending on each others, so you may need to build/push some components before others.

Here's a quick view to see thoses relations :

```
├─ @ezpaarse-project/ezreeport-common
|  ├─ ezreeport-mail
|  ├─ ezreeport-report
|  ├─ ezreeport-scheduler
|  └─ ezreeport-worker
├─ @ezpaarse-project/ezreeport-admin
└─ @ezpaarse-project/sdk-js
   └─ @ezpaarse-project/vue
```

## Main branches

- `master`:
  - Should be the version used on prod (vp)
- `rc/*`:
  - Should be the version used on integ (vi)
  - Versions are suffixed by `-rc.*`
- `dev`:
  - Should be the version used on dev (vd)
  - Versions are suffixed by `-beta.*`

## Publishing components

```bash
# Test, and build a first time to test if everything is stable

# Generate changelogs, etc. as it will bump version (called tag later)
pnpm run publish

# Build and push docker services on registries
VERSION=$TAG docker buildx bake

# Build and push npm packages
pnpm --filter $PACKAGE  turbo publish
```