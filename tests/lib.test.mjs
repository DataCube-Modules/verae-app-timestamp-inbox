import assert from "node:assert/strict";
import { createClient, createMemoryFetch } from "../src/peergos-sdk.mjs";
import { listInbox, parseReceipt, scopeRank } from "../src/lib.mjs";

const fetchImpl = createMemoryFetch();
const client = createClient(fetchImpl);
await client.writeJSON("/inbox/a.reply.json", { hash: "sha256:1", scope: "global", cube_id: "C" });
await client.writeJSON("/inbox/note.txt", { x: 1 });
const files = await listInbox(client);
assert.deepEqual(files, ["a.reply.json"]);
const r = parseReceipt(await client.readJSON("/inbox/a.reply.json"));
assert.equal(r.ok, true);
assert.equal(r.scope, "global");
assert.equal(scopeRank("local"), 1);
assert.equal(scopeRank("shared"), 2);
assert.equal(scopeRank("global"), 3);
assert.equal(scopeRank("nope"), 0);
assert.equal(parseReceipt(null).ok, false);
console.log("timestamp-inbox tests ok");
