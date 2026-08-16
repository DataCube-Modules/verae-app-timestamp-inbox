#!/usr/bin/env bash
set -euo pipefail
python3 - << 'PY'
import json, pathlib, re, sys
root = pathlib.Path(".")
man = json.loads((root/"peergos-app.json").read_text())
assert man.get("schemaVersion") == 1, "schemaVersion"
assert len(man.get("displayName","")) <= 25, "displayName"
assert len(man.get("description","")) <= 100, "description"
assert man.get("launchable") is True
assert (root/"assets/index.html").is_file()
text = ""
for p in (root/"assets").rglob("*"):
    if p.is_file() and p.suffix in {".html",".js",".css"}:
        text += p.read_text(errors="ignore")
if re.search(r"nats\.connect|new\s+WebSocket\s*\(|wss://|NATS\.connect", text):
    sys.exit("forbidden NATS/WebSocket in assets")
# fetch targets: allow /peergos-api or relative
for m in re.finditer(r"fetch\(([^)]+)\)", text):
    arg = m.group(1)
    if "http://" in arg or "https://" in arg:
        sys.exit("absolute fetch: "+arg)
print("peergos compliance: PASS")
PY
