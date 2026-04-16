#!/usr/bin/env bash
set -euo pipefail

NETLIFY=${NETLIFY:-netlify}
EXAMPLE_DIR=${EXAMPLE_DIR:-./examples/netlify-example}

usage(){
  cat <<EOF
Usage: $0 <command> [args]
Commands:
  create-site <name>
  deploy-example [--prod]
  set-env <key> <value>
  get-env <key>
  cleanup
EOF
}

create_site(){
  local name=$1
  "$NETLIFY" create "$name"
}

deploy_example(){
  local prod_flag=""
  if [[ ${1:-} == "--prod" ]]; then
    prod_flag="--prod"
  fi
  cd "$EXAMPLE_DIR"
  "$NETLIFY" deploy $prod_flag
}

set_env(){
  local key=$1
  local value=$2
  "$NETLIFY" env:set "$key" "$value"
}

get_env(){
  local key=$1
  "$NETLIFY" env:get "$key"
}

cleanup(){
  # Get current site ID
  SITE_ID=$(netlify status --json 2>/dev/null | jq -r '.siteData."site-id" // empty')
  if [[ -n "$SITE_ID" ]]; then
    echo "Deleting site $SITE_ID..."
    "$NETLIFY" sites:delete "$SITE_ID" --force
  else
    echo "No linked site found."
  fi
}

# Dispatch
if [[ $# -lt 1 ]]; then usage; exit 1; fi
cmd=$1; shift
case "$cmd" in
  create-site) create_site "$@" ;;
  deploy-example) deploy_example "$@" ;;
  set-env) set_env "$@" ;;
  get-env) get_env "$@" ;;
  cleanup) cleanup ;;
  *) usage; exit 2 ;;
esac