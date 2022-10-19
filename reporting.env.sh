#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_PASSWORD=""
export LOG_LEVEL=""
# export ANY="value"

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi