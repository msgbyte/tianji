#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 0 ] || [ ! -f scripts/bundle.mjs ]; then
  echo "Run this script from a project created by init-artifact.sh." >&2
  exit 1
fi

pnpm build
