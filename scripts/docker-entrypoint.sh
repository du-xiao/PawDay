#!/bin/sh
set -eu

case "${PUID:-}" in
  ''|*[!0-9]*) echo "PUID 必须是数字" >&2; exit 1 ;;
esac

case "${PGID:-}" in
  ''|*[!0-9]*) echo "PGID 必须是数字" >&2; exit 1 ;;
esac

mkdir -p /data /uploads /app/.next/cache

# Some NAS filesystems do not allow chown even when the configured user can write.
chown -R "${PUID}:${PGID}" /data /uploads 2>/dev/null || true
chown -R "${PUID}:${PGID}" /app/.next/cache

if ! su-exec "${PUID}:${PGID}" sh -c '
  data_probe="/data/.pawday-write-test-$$"
  upload_probe="/uploads/.pawday-write-test-$$"
  cache_probe="/app/.next/cache/.pawday-write-test-$$"
  temp_probe="/tmp/.pawday-write-test-$$"

  touch /data/pawday.db && test -w /data/pawday.db &&
  touch "$data_probe" && rm "$data_probe" &&
  touch "$upload_probe" && rm "$upload_probe" &&
  touch "$cache_probe" && rm "$cache_probe" &&
  touch "$temp_probe" && rm "$temp_probe"
'; then
  echo "运行目录不可写，请检查 /data、/uploads、/app/.next/cache 以及 PUID/PGID 权限" >&2
  exit 1
fi

exec su-exec "${PUID}:${PGID}" "$@"
