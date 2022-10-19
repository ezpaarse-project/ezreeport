#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_HOST=""
export REDIS_PORT=""
export REDIS_PASSWORD=""
export LOG_LEVEL=""
export ELASTIC_SCHEME=""
export ELASTIC_HOST=""
export ELASTIC_PORT=""
# API key must have "monitor" and "manage_security" privileges
export ELASTIC_API_KEY=""
# export ANY="value"

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi