#!/usr/bin/env bash
# Build the site for staging and copy it where the staging nginx reads it. The staging
# build keeps the design system previews (/ds/), which production leaves out.
# Rerunnable: each run rebuilds and mirrors dist/ exactly (rsync --delete).
#
#   STAGING_SITE_URL  the staging public URL     (default https://staging-blog.pierrickbignet.com)
#   STAGING_DIST_DIR  the folder nginx serves     (default ~/ContainersData/blog-staging/dist)
set -euo pipefail

site_url="${STAGING_SITE_URL:-https://staging-blog.pierrickbignet.com}"
target="${STAGING_DIST_DIR:-$HOME/ContainersData/blog-staging/dist}"

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo"

# rsync --delete empties whatever it is pointed at: refuse a missing target
# rather than create one at a mistyped path.
if [[ ! -d "$target" ]]; then
  echo "deploy-staging: target $target does not exist, create it first" >&2
  exit 1
fi

pnpm install --frozen-lockfile
BUILD_TARGET=staging SITE_URL="$site_url" pnpm build

# nginx reads the files as uid 101: everything world-readable.
rsync -a --delete --chmod=D755,F644 dist/ "$target/"

echo "deploy-staging: $site_url built and copied to $target"
