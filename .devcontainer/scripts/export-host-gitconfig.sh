#!/bin/sh
set -eu

keys="
  user.name
  user.email
  gpg.format
  commit.gpgSign
  tag.gpgSign
  init.defaultBranch
  pull.rebase
  push.autoSetupRemote
"

out="$(cd "$(dirname "$0")/.." && pwd)/.gitconfig.host"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

put() {
  if [ -n "$2" ]; then
    git config --file "$tmp" "$1" "$2"
  fi
}

get() {
  (cd / && git config --get "$1") 2>/dev/null || true
}

if command -v git >/dev/null 2>&1; then
  for key in $keys; do
    put "$key" "$(get "$key")"
  done

  signing_key="$(get user.signingKey)"
  if [ "$(get gpg.format)" = ssh ]; then
    case "$signing_key" in
      "~/"*) signing_key="$HOME/${signing_key#"~/"}" ;;
    esac
    case "$signing_key" in
      key::* | ssh-* | "") ;;
      *.pub) [ -r "$signing_key" ] && signing_key="key::$(cat "$signing_key")" ;;
      *) [ -r "$signing_key.pub" ] && signing_key="key::$(cat "$signing_key.pub")" ;;
    esac
  fi
  put user.signingKey "$signing_key"

  put author.name "${GIT_AUTHOR_NAME:-}"
  put author.email "${GIT_AUTHOR_EMAIL:-}"
  put committer.name "${GIT_COMMITTER_NAME:-}"
  put committer.email "${GIT_COMMITTER_EMAIL:-}"
fi

chmod 644 "$tmp"
mv "$tmp" "$out"
