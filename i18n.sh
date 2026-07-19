#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="${SCRIPT_DIR}/src/client"

pnpm --dir "${CLIENT_DIR}" run translation:extract
pnpm --dir "${CLIENT_DIR}" run translation:scan
pnpm --dir "${CLIENT_DIR}" run translation:translate
