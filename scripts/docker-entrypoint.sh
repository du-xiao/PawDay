#!/bin/sh
set -eu

case "${PUID:-}" in
  ''|*[!0-9]*) echo "PUID 必须是数字" >&2; exit 1 ;;
esac

case "${PGID:-}" in
  ''|*[!0-9]*) echo "PGID 必须是数字" >&2; exit 1 ;;
esac

mkdir -p /data /uploads

# Some NAS filesystems do not allow chown even when the configured user can write.
chown -R "${PUID}:${PGID}" /data /uploads 2>/dev/null || true

if ! su-exec "${PUID}:${PGID}" sh -c 'touch /data/pawday.db && test -w /data/pawday.db && test -w /uploads'; then
  echo "无法写入 /data 或 /uploads，请检查 NAS 挂载路径以及 PUID/PGID 权限" >&2
  exit 1
fi

exec su-exec "${PUID}:${PGID}" "$@"
