# ezReeport

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezreeport.git
npm run setup
```

## Main branches

- `master`:
  - Should be the version used on prod (vp) and preprod (vi)
- `develop`:
  - Should be the version used on dev (vd)

## Services

- `src/services/report`:
  - Generate PDF reports with HTTP API. Also run cronjob to generate reports
- `src/services/mail`:
  - Handle email management
- `src/services/metric`:
  - Config files for metrics (you may need to to run `sudo chown root src/services/metrics/*` and `sudo chmod 600 src/services/metrics/*`)


## Packages

- `src/sdk` (ezreeport-sdk-js)
  - SDK for ezReeport API
- `src/vue` (ezreeport-vue)
  - Vue components that use SDK for displaying info

## Start

### Prod

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml up -d
```

### Dev

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml -f docker-compose.debug.yml up -d
```

## Test

Located at `tests`

```bash
npm test
```