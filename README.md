# verae-app-timestamp-inbox

Show Local/Shared/Global timestamp receipts from inbox

**Specialist:** Timestamp engineer + JS  
**Plan:** `PLAN-APPS-WAVE2.md`  
**Pattern:** Peergos sandbox + file store; NATS only via outbox connector.

## Install (Peergos)

1. Sign in at https://peergos.georgelambert.org
2. Apps → Custom, or upload this folder and **Install App** on `peergos-app.json`.
3. Grant the listed permissions.

```
OrgTool install-app <server> <user> <pass> timestamp-inbox .
```

## Develop

```
make test
make certify
```

## Docs

- [docs/SPECS.md](docs/SPECS.md) — function names, I/O, behavior
- [docs/INSTALL.md](docs/INSTALL.md)
- [docs/DEVELOPER.md](docs/DEVELOPER.md)
