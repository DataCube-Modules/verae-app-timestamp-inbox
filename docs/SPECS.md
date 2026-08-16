# Function specs — timestamp-inbox

Specialist: Timestamp + JS.

## listInbox(client) → Promise<string[]>
JSON filenames in `/inbox/`.

## parseReceipt(obj) → {scope, hash, cube_id, ok}
Defaults scope to local; ok iff hash present.

## scopeRank(scope) → 0|1|2|3
local=1 shared=2 global=3 else 0.
