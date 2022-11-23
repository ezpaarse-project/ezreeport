#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_HOST=""
export REDIS_PORT=""
export REDIS_PASSWORD=""
export REDIS_CONCURRENCE=""

export ELASTIC_SCHEME="https"
export ELASTIC_HOST=""
export ELASTIC_PORT="9200"
export ELASTIC_API_KEY="" # Base 64
export ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"

export DATABASE_PROTOCOL="postgresql"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD="changeme"
export DATABASE_HOST="db"
export DATABASE_PORT=5432
export DATABASE_DB="postgres"
export DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"

export SMTP_HOST="maildev"
export SMTP_PORT=1025
export SMTP_SECURE=""
export SMTP_IGNORE_TLS=""
export SMTP_REJECT_UNAUTHORIZED=""

export EMAIL_SENDER=""
export EMAIL_EZTEAM=""
export EMAIL_ATTEMPTS=""
export EMAIL_ATTEMPTS_INTERVAL=""

export EZMESURE_AUTH_SECRET=""

export CRON_GENERATE_REPORT=""
export CRON_PURGE_OLD_REPORT=""

export MONITORING_INDEX_PREFIX="reporting-"
export MONITORING_API_KEY="" # "Beats" version of ELASTIC_API_KEY
export MONITORING_SCHEDULE="@every 5s"

export LOG_LEVEL=""

export ALLOWED_ORIGINS="*" # Comma separated origins (or * to allow all)

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi
