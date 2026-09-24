#!/usr/bin/env bash

set -euo pipefail

sudo chown node:node node_modules

mkdir -p "$(dirname "$GIT_CONFIG_GLOBAL")"
git config --global include.path "$PWD/.devcontainer/.gitconfig.host"

origin_host="$(git remote get-url origin 2>/dev/null | sed -E 's#^[a-z+]+://([^@/]*@)?([^:/]+).*#\2#; s#^[^@/]+@([^:]+):.*#\1#')" || true
if [ -n "$origin_host" ] && ! getent hosts "$origin_host" >/dev/null; then
  echo "warning: git origin host '$origin_host' does not resolve inside the container" >&2
fi

pnpm ci
