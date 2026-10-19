# i18n Wrapper Script Design

## Goal

Add a root-level `i18n.sh` entry point that runs the Tianji client localization workflow in order:

1. `translation:extract`
2. `translation:scan`
3. `translation:translate`

## Script behavior

The script will use Bash with strict error handling. It will resolve `src/client` relative to the script file rather than the caller's current directory, so `i18n.sh` can be invoked from anywhere.

Each client command will run through `pnpm --dir <client-directory> run <command>`. Commands will execute sequentially, and a failure will stop the workflow immediately. The wrapper will not add another package script or duplicate configuration from `src/client/i18next-toolkit.config.cjs`.

## Error handling

`set -euo pipefail` will propagate command failures and prevent later translation stages from running after an earlier failure. Missing `pnpm`, missing client files, and translation-provider failures will therefore produce a non-zero script exit without custom error rewriting.

## Verification

A shell-level regression test will put a recording `pnpm` stub first in `PATH`, then invoke `i18n.sh` from outside the repository root. It will verify the client directory, exact command order, and fail-fast behavior without invoking the real translation provider or modifying locale JSON files.
