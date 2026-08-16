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
