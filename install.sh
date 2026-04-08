#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"
skills_dir="$codex_home/skills"

mkdir -p "$skills_dir"

for skill in web-performance web-i18n web-testing; do
  rm -rf "$skills_dir/$skill"
  cp -R "$repo_dir/skills/$skill" "$skills_dir/$skill"
done

echo "Installed skills to $skills_dir"
