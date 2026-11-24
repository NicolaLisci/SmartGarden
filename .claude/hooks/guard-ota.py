#!/usr/bin/env python3
"""PreToolUse hook: network uploads to the NodeMCU must go through firmware/tools/ota-upload.sh.

A guardrail against honest mistakes, not a sandbox: the real check is the script itself.
Each shell statement is judged on its own; on any parsing error the hook blocks.
"""
import json, re, sys

WRAPPER = "firmware/tools/ota-upload.sh"
DIRECT = re.compile(r"--protocol[=\s]+network|esp[-_]?ota", re.I)


def block(why):
    print(f"BLOCKED: {why}. OTA uploads go only through {WRAPPER} <sketch-dir>.", file=sys.stderr)
    sys.exit(2)


try:
    cmd = (json.load(sys.stdin).get("tool_input") or {}).get("command")
    if not isinstance(cmd, str):
        block("hook could not read the command")
except Exception:
    block("hook could not read the command")

for stmt in re.split(r"&&|\|\||[;|\n]", cmd):
    words = stmt.split()
    runs_wrapper = bool(words) and words[0].endswith(WRAPPER)
    if DIRECT.search(stmt) and not runs_wrapper:
        block("direct network upload")
