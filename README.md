# Reporting

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/reporting.git
npm run setup
```

## Services

- `src/services/report`:
  - Generate PDF reports with HTTP API. Also run cronjob to generate reports
- `src/services/mail`:
  - Handle email management
- `src/services/metric`:
  - Config files for metrics (you may need to to run `sudo chown root src/services/metrics/*` and `sudo chmod 600 src/services/metrics/*`)


## Packages

- `src/sdk`
  - SDK for report API

## Start

### Prod

```bash
source reporting.env.sh
docker compose up -d
```

### Dev

```bash
source reporting.env.sh
docker compose -f docker-compose.debug.yml up -d
```

## Test

Located at `tests`

```bash
npm test
```