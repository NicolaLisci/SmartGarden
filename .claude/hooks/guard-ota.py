#!/usr/bin/env python3
"""PreToolUse hook: network uploads to the NodeMCU must go through firmware/tools/ota-upload.sh."""
import json, re, sys

cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
direct = re.search(r"--protocol\s+network|espota", cmd)
if direct and "firmware/tools/ota-upload.sh" not in cmd:
    print("BLOCKED: OTA uploads go only through firmware/tools/ota-upload.sh <sketch-dir>, "
          "which refuses builds that would lose ArduinoOTA.", file=sys.stderr)
    sys.exit(2)
