import { makeEnvelope, enqueue } from "./peergos-sdk.mjs";

export const TS_SUBJECT = "verae.ts.request";

/**
 * enqueueStamp
 * Input: client, {hash, cube_id, scope="local"}
 * Output: outbox path
 * Behavior: writes verae.ts.request; reply_file `<id>.ts.json`.
 */
export async function enqueueStamp(client, opts) {
  if (!opts || !opts.hash) throw new Error("hash required");
  if (!opts.cube_id) throw new Error("cube_id required");
  const scope = opts.scope || "local";
  if (["local", "shared", "global"].indexOf(scope) < 0) throw new Error("scope must be local|shared|global");
  return enqueue(client, opts.cube_id + "-ts", makeEnvelope(TS_SUBJECT, {
    hash: opts.hash,
    cube_id: opts.cube_id,
    scope,
  }, opts.cube_id + ".ts.json"));
}

/**
 * listInbox
 * Input: client.list
 * Output: string[] filenames under /inbox/
 */
export async function listInbox(client) {
  const listing = await client.list("/inbox");
  return listing.files.filter((f) => f.endsWith(".json")).sort();
}

/**
 * parseReceipt
 * Input: JSON object
 * Output: {scope, hash, cube_id, ok}
 * Behavior: scope default "local"; ok false if missing hash.
 */
export function parseReceipt(obj) {
  if (!obj || typeof obj !== "object") return { scope: "local", hash: "", cube_id: "", ok: false };
  const scope = obj.scope || (obj.receipt && obj.receipt.scope) || "local";
  const hash = obj.hash || (obj.receipt && obj.receipt.hash) || "";
  const cube_id = obj.cube_id || (obj.receipt && obj.receipt.cube_id) || "";
  return { scope, hash, cube_id, ok: !!hash };
}

/**
 * scopeRank
 * Input: "local"|"shared"|"global"|other
 * Output: 1, 2, 3, or 0
 */
export function scopeRank(scope) {
  if (scope === "local") return 1;
  if (scope === "shared") return 2;
  if (scope === "global") return 3;
  return 0;
}
