#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash init-artifact.sh <new-project-directory>" >&2
  exit 1
fi

node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 or newer is required."); process.exit(1); }'
command -v pnpm >/dev/null || { echo "Install pnpm before initializing an artifact." >&2; exit 1; }
command -v tar >/dev/null || { echo "tar is required to extract the bundled UI components." >&2; exit 1; }

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$1"
case "$PROJECT_DIR" in
  /*) ;;
  *) PROJECT_DIR="$PWD/$PROJECT_DIR" ;;
esac

# mkdir fails for existing files, directories, and symlinks without overwriting them.
mkdir "$PROJECT_DIR"
cp -R "$SKILL_DIR/assets/react/." "$PROJECT_DIR/"
cp "$SKILL_DIR/LICENSE.txt" "$SKILL_DIR/THIRD_PARTY.md" "$PROJECT_DIR/"
tar -xzf "$SKILL_DIR/assets/shadcn-components.tar.gz" -C "$PROJECT_DIR/src"
cd "$PROJECT_DIR"
pnpm install --frozen-lockfile
echo "Artifact project ready: $PROJECT_DIR"
echo "Edit src/App.tsx, run pnpm dev to preview, then pnpm build to create bundle.html."
