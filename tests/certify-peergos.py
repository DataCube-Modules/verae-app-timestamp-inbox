#!/usr/bin/env python3
"""Peergos sandbox validator (mirrors web-ui/src/mixins/sandbox/index.js)."""
import json, pathlib, re, sys

VALID_PERMS = {
    "STORE_APP_DATA", "EDIT_CHOSEN_FILE", "READ_CHOSEN_FOLDER",
    "EXCHANGE_MESSAGES_WITH_FRIENDS", "USE_MAILBOX", "ACCESS_PROFILE_PHOTO",
    "CSP_UNSAFE_EVAL", "ADMIN_INSTANCE",
}
ALLOWED_ABS_FETCH = (
    "https://billing.peergos.georgelambert.org",
)
DN = re.compile(r"^[a-z\d\-_\s]+$", re.I)
VER = re.compile(r"^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$")

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
man_path = root / "peergos-app.json"
if not man_path.is_file():
    sys.exit("missing peergos-app.json")
man = json.loads(man_path.read_text())
err = []

for f in ("displayName", "description", "launchable"):
    if f not in man:
        err.append(f"missing {f}")
dn, desc = man.get("displayName", ""), man.get("description", "")
if not isinstance(dn, str) or len(dn) > 25 or "." in dn or not DN.match(dn or "x"):
    err.append(f"displayName {dn!r}")
if not isinstance(desc, str) or len(desc) > 100:
    err.append(f"description length {len(desc)}")
ver = man.get("version") or ""
if not VER.match(ver):
    err.append(f"version {ver!r}")
if man.get("schemaVersion") not in (1, "1"):
    err.append("schemaVersion must be 1")
if not isinstance(man.get("launchable"), bool):
    err.append("launchable not bool")
folder = man.get("folderAction", False)
if folder is not None and not isinstance(folder, bool):
    err.append("folderAction not bool")
author = man.get("author") or ""
if len(author) > 32:
    err.append("author too long")
perms = man.get("permissions") or []
if not isinstance(perms, list):
    err.append("permissions not array")
else:
    for p in perms:
        if p not in VALID_PERMS:
            err.append(f"invalid permission {p}")
if man.get("launchable") and folder:
    err.append("launchable+folderAction: Apps grid open will fail")
if folder and "READ_CHOSEN_FOLDER" not in perms:
    err.append("folderAction requires READ_CHOSEN_FOLDER")
if man.get("template") in ("messaging", "messaging-instance"):
    if "EXCHANGE_MESSAGES_WITH_FRIENDS" not in perms:
        err.append("template needs EXCHANGE_MESSAGES_WITH_FRIENDS")
    if not (man.get("appIcon") or ""):
        err.append("template needs appIcon")
assets = root / "assets"
if not (assets / "index.html").is_file():
    err.append("missing assets/index.html")
icon = man.get("appIcon") or ""
if icon:
    ip = assets / icon
    if not ip.is_file():
        err.append(f"appIcon missing {icon}")
    elif ip.suffix.lower() not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
        err.append(f"appIcon must be a raster image, not {ip.suffix}")

text = ""
for p in assets.rglob("*"):
    if p.is_file() and p.suffix.lower() in {".html", ".js", ".css", ".mjs"}:
        text += p.read_text(errors="ignore") + "\n"
if re.search(r"nats\.connect|new\s+WebSocket\s*\(|wss://|NATS\.connect", text):
    err.append("forbidden NATS/WebSocket in assets")
for m in re.finditer(r"fetch\s*\(([^)]+)\)", text):
    arg = m.group(1)
    if "http://" in arg or "https://" in arg:
        if not any(h in arg for h in ALLOWED_ABS_FETCH):
            err.append("absolute fetch: " + arg[:120])

if err:
    print("peergos compliance: FAIL")
    for e in err:
        print(" -", e)
    sys.exit(1)
print("peergos compliance: PASS")
