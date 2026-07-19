#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${ROOT_DIR}/i18n.sh"
TMP_DIR="$(mktemp -d)"
FAKE_BIN="${TMP_DIR}/bin"
LOG_FILE="${TMP_DIR}/pnpm.log"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

mkdir -p "${FAKE_BIN}"

cat >"${FAKE_BIN}/pnpm" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${PNPM_LOG_FILE}"
if [[ -n "${FAIL_ON_COMMAND:-}" && "$*" == *"${FAIL_ON_COMMAND}"* ]]; then
  exit 42
fi
STUB
chmod +x "${FAKE_BIN}/pnpm"

run_wrapper() {
  (cd "${TMP_DIR}" && PATH="${FAKE_BIN}:${PATH}" PNPM_LOG_FILE="${LOG_FILE}" "$@" "${SCRIPT_PATH}")
}

run_wrapper env

cat >"${TMP_DIR}/expected-success.log" <<EOF
--dir ${ROOT_DIR}/src/client run translation:extract
--dir ${ROOT_DIR}/src/client run translation:scan
--dir ${ROOT_DIR}/src/client run translation:translate
EOF
diff -u "${TMP_DIR}/expected-success.log" "${LOG_FILE}"

: >"${LOG_FILE}"
set +e
run_wrapper env FAIL_ON_COMMAND=translation:scan
exit_code=$?
set -e

[[ "${exit_code}" -eq 42 ]]
cat >"${TMP_DIR}/expected-failure.log" <<EOF
--dir ${ROOT_DIR}/src/client run translation:extract
--dir ${ROOT_DIR}/src/client run translation:scan
EOF
diff -u "${TMP_DIR}/expected-failure.log" "${LOG_FILE}"
