#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

input="$(cat)"
status="completed"

if command -v jq >/dev/null 2>&1; then
  status="$(printf '%s' "$input" | jq -r '.status // "completed"')"
fi

if [[ "$status" == "aborted" ]]; then
  printf '{}\n'
  exit 0
fi

OXFMT="$ROOT/node_modules/.bin/oxfmt"
TSC="$ROOT/node_modules/.bin/tsc"

if [[ ! -x "$OXFMT" || ! -x "$TSC" ]]; then
  printf '{}\n'
  echo "[corkbord hook] oxfmt or tsc not found in node_modules/.bin; skipping checks." >&2
  exit 0
fi

errors=""

run_step() {
  local label="$1"
  shift
  local output
  local exit_code=0

  output="$("$@" 2>&1)" || exit_code=$?

  if [[ "$exit_code" -ne 0 ]]; then
    errors+="${label} failed (exit ${exit_code})"
    errors+=$'\n'
    errors+="$(printf '%s' "$output" | tail -n 40)"
    errors+=$'\n\n'
  fi
}

changed_files=()
if git rev-parse HEAD >/dev/null 2>&1; then
  while IFS= read -r file; do
    [[ -n "$file" ]] && changed_files+=("$file")
  done < <(
    {
      git diff --name-only --diff-filter=ACMRTUXB HEAD
      git diff --name-only --cached --diff-filter=ACMRTUXB HEAD
      git ls-files --others --exclude-standard
    } | sort -u | grep -E '\.(ts|tsx|json|md)$' || true
  )
else
  while IFS= read -r file; do
    [[ -n "$file" ]] && changed_files+=("$file")
  done < <(
    git ls-files --others --exclude-standard | grep -E '\.(ts|tsx|json|md)$' || true
  )
fi

if [[ ${#changed_files[@]} -gt 0 ]]; then
  run_step "oxfmt format" "$OXFMT" "${changed_files[@]}"
fi

needs_typecheck=false
if [[ ${#changed_files[@]} -eq 0 ]]; then
  needs_typecheck=false
else
  for file in "${changed_files[@]}"; do
    case "$file" in
      *.ts|*.tsx) needs_typecheck=true ;;
    esac
  done
fi

if [[ "$needs_typecheck" == true ]]; then
  run_step "Typecheck" "$TSC" --noEmit -p tsconfig.json
fi

if [[ -n "$errors" ]]; then
  message="Post-edit verification failed. Fix the issues below, then continue.

${errors}"

  if command -v jq >/dev/null 2>&1; then
    jq -n --arg msg "$message" '{followup_message: $msg}'
  else
    node -e 'const msg=process.argv[1]; process.stdout.write(JSON.stringify({followup_message: msg}));' "$message"
  fi
  exit 0
fi

printf '{}\n'
