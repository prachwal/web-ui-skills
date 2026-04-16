#!/usr/bin/env bash
set -euo pipefail

AUTH0=${AUTH0:-auth0}
TMP_DIR=${TMP_DIR:-./tmp}
mkdir -p "$TMP_DIR"

usage(){
  cat <<EOF
Usage: $0 <command> [args]
Commands:
  create-client <name> <callback_url>
  update-client <client_id> <name>
  delete-client <client_id>
  batch-create-users --connection <connection> <csv_file>
  export-config
  clear-all
EOF
}

create_client(){
  local name=$1
  local callback=$2
  "$AUTH0" apps create --name "$name" --type regular --callbacks "$callback" --json | tee "$TMP_DIR/client_${name}.json"
}

update_client(){
  local id=$1
  local name=$2
  "$AUTH0" apps update "$id" --name "$name" --json | tee "$TMP_DIR/client_update_${id}.json"
}

delete_client(){
  local id=$1
  # backup before delete
  "$AUTH0" apps show "$id" --json > "$TMP_DIR/client_backup_${id}.json"
  "$AUTH0" apps delete "$id" --force
}

batch_create_users(){
  local connection="${1:-Username-Password-Authentication}"
  local csv_file="$2"
  # CSV format: email,password
  while IFS=',' read -r email password; do
    if [[ -z "$email" ]]; then continue; fi
    echo "Creating $email..."
    printf '{"email":"%s","password":"%s","connection":"%s"}\n' "$email" "$password" "$connection" > "$TMP_DIR/user_payload.json"
    "$AUTH0" users create --json < "$TMP_DIR/user_payload.json" | tee "$TMP_DIR/user_${email}.json"
    sleep 0.2
  done < "$csv_file"
}

export_config(){
  # Best-effort export; depends on CLI support
  "$AUTH0" clients list --json > "$TMP_DIR/clients.json"
  "$AUTH0" resource-servers list --json > "$TMP_DIR/resource_servers.json" || true
  "$AUTH0" connections list --json > "$TMP_DIR/connections.json" || true
}
clear_all(){
  echo "Clearing all objects from Auth0 tenant..."
  # Apps
  echo "Deleting apps..."
  "$AUTH0" apps list --json | jq -r '.[].client_id' | while read -r id; do
    echo "Deleting app $id"
    "$AUTH0" apps delete "$id" --force
  done
  # Resource servers
  echo "Deleting resource servers..."
  "$AUTH0" apis list --json | jq -r '.[] | select(.name != "Auth0 Management API") | .id' | while read -r id; do
    echo "Deleting resource server $id"
    "$AUTH0" apis delete "$id" --force
  done
  # Roles
  echo "Deleting roles..."
  "$AUTH0" roles list --json | jq -r '.[].id' | while read -r id; do
    echo "Deleting role $id"
    "$AUTH0" roles delete "$id" --force
  done
  # Users
  echo "Deleting users..."
  "$AUTH0" users search --query "user_id:*" --json | jq -r '.[].user_id' | while read -r id; do
    echo "Deleting user $id"
    "$AUTH0" users delete "$id" --force
  done
  # Rules
  echo "Deleting rules..."
  "$AUTH0" rules list --json | jq -r '.[].id' | while read -r id; do
    echo "Deleting rule $id"
    "$AUTH0" rules delete "$id" --force
  done
  echo "All supported objects cleared."
}
# Dispatch
if [[ $# -lt 1 ]]; then usage; exit 1; fi
cmd=$1; shift
case "$cmd" in
  create-client) create_client "$@" ;; 
  update-client) update_client "$@" ;; 
  delete-client) delete_client "$@" ;; 
  batch-create-users) batch_create_users "$@" ;; 
  export-config) export_config ;; 
  clear-all) clear_all ;; 
  *) usage; exit 2 ;;
esac
