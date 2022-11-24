#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_HOST="redis"
export REDIS_PORT=6379
export REDIS_PASSWORD=""
export REDIS_CONCURRENCE=5

export ELASTIC_SCHEME="https"
export ELASTIC_HOST="host.docker.internal"
export ELASTIC_PORT=9200
export ELASTIC_API_KEY="" # Base 64
export ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"

export DATABASE_PROTOCOL="postgresql"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD=""
export DATABASE_HOST="db"
export DATABASE_PORT=5432
export DATABASE_DB="postgres"
export DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"

export SMTP_HOST="maildev"
export SMTP_PORT=1025
export SMTP_SECURE="false"
export SMTP_IGNORE_TLS="false"
export SMTP_REJECT_UNAUTHORIZED="false"

export EMAIL_SENDER="ezmesure-reporting@couperin.org"
export EMAIL_EZTEAM="ezteam@couperin.org"
export EMAIL_ATTEMPTS=5
export EMAIL_ATTEMPTS_INTERVAL=200

export EZMESURE_AUTH_SECRET="" # ezMesure API key
export EZMESURE_DEPOSITORS_INDEX="depositors"

export CRON_GENERATE_REPORT="0 0 * * *"
export CRON_PURGE_OLD_REPORT="0 0 * * *"

export MONITORING_INDEX_PREFIX="reporting-"
export MONITORING_API_KEY="" # "Beats" version of ELASTIC_API_KEY
export MONITORING_SCHEDULE="@every 5s"

export API_DOMAIN="http://localhost:8080"
export API_ALLOWED_ORIGINS="*" # Comma separated origins (or * to allow all)

export LOG_LEVEL="info"

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi
