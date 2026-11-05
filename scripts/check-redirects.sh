#!/usr/bin/env bash
# Check the redirect list against a running site: each old URL must answer 301 to the
# right target, and the target must answer 200. Used on the preview, then after the switch.
#
#   scripts/check-redirects.sh <base-url> [redirects.map]
#   scripts/check-redirects.sh https://blog.pierrickbignet.com
#
#   CURL_ARGS  extra curl arguments, split on spaces: for a site behind a login,
#              CURL_ARGS='--config /path/to/curl-config' (a file holding the header or cookie)
#
# Exits 1 when any line fails. Needs curl.
set -uo pipefail

base="${1:?usage: check-redirects.sh <base-url> [redirects.map]}"
base="${base%/}"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
map="${2:-$repo/redirects/redirects.map}"

# shellcheck disable=SC2206
curl_args=(--silent --output /dev/null --max-time 20 ${CURL_ARGS:-})

total=0
failed=0
while read -r from to; do
  [[ -z "$from" || "$from" == \#* ]] && continue
  to="${to%;}"
  total=$((total + 1))

  read -r code location < <(curl "${curl_args[@]}" --write-out '%{http_code} %{redirect_url}\n' "$base$from")
  # the redirect may be absolute or relative to the host: compare the path only
  location_path="/${location#*://*/}"
  [[ -z "$location" ]] && location_path=""

  if [[ "$code" != 301 ]]; then
    echo "FAIL $from: expected 301, got $code"
    failed=$((failed + 1))
    continue
  fi
  if [[ "$location_path" != "$to" ]]; then
    echo "FAIL $from: redirects to ${location_path:-nothing}, expected $to"
    failed=$((failed + 1))
    continue
  fi
  target_code="$(curl "${curl_args[@]}" --write-out '%{http_code}' "$base$to")"
  if [[ "$target_code" != 200 ]]; then
    echo "FAIL $from: target $to answers $target_code"
    failed=$((failed + 1))
  fi
done < "$map"

echo "check-redirects: $((total - failed))/$total ok on $base"
[[ "$failed" -eq 0 ]]
