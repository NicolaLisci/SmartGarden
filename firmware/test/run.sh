#!/usr/bin/env bash
# Compiles and runs the host unit tests of the firmware logic (no board needed).
set -euo pipefail
cd "$(dirname "$0")"
OUT="$(mktemp -d)"; trap 'rm -rf "$OUT"' EXIT
for t in *_test.cpp; do
  c++ -std=c++17 -Wall -Wextra -Werror -o "$OUT/${t%.cpp}" "$t"
  "$OUT/${t%.cpp}"
done
