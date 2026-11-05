#!/usr/bin/env bash
# Build the site for production and copy it where the production nginx reads it.
# Production leaves out the design system previews (/ds/). Runs from a clean `main` only:
# what is served is what is merged.
# Rerunnable: each run rebuilds and mirrors dist/ exactly (rsync --delete).
#
#   PROD_SITE_URL  the public URL            (default https://blog.pierrickbignet.com)
#   PROD_DIST_DIR  the folder nginx serves   (default ~/ContainersData/blog/dist)
set -euo pipefail

site_url="${PROD_SITE_URL:-https://blog.pierrickbignet.com}"
target="${PROD_DIST_DIR:-$HOME/ContainersData/blog/dist}"

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo"

branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != main ]]; then
  echo "deploy-prod: on branch $branch, production is built from main only" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "deploy-prod: the working tree is not clean, commit or stash first" >&2
  exit 1
fi

# rsync --delete empties whatever it is pointed at: refuse a missing target
# rather than create one at a mistyped path.
if [[ ! -d "$target" ]]; then
  echo "deploy-prod: target $target does not exist, create it first" >&2
  exit 1
fi

pnpm install --frozen-lockfile
# no BUILD_TARGET: the production build, without /ds/
SITE_URL="$site_url" pnpm build

# nginx reads the files as uid 101: everything world-readable. --delay-updates puts the
# new files in place at the end of the run, so a visitor never meets a half-copied site.
rsync -a --delete --delay-updates --chmod=D755,F644 dist/ "$target/"

echo "deploy-prod: $site_url built and copied to $target"
