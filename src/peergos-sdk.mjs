// Peergos data + outbox helpers. Tests inject fetchImpl.
export const DATA_BASE = "/peergos-api/v0/data";

export function createClient(fetchImpl, base = DATA_BASE) {
  const f = fetchImpl || globalThis.fetch.bind(globalThis);

  async function req(path, opts = {}) {
    const res = await f(base + path, opts);
    return res;
  }

  return {
    async writeJSON(path, obj) {
      const res = await req(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj),
      });
      if (!res.ok) throw new Error("PUT " + path + " " + res.status);
      return res;
    },
    async readJSON(path) {
      const res = await req(path);
      if (!res.ok) throw new Error("GET " + path + " " + res.status);
      return res.json();
    },
    async list(path) {
      const p = path.endsWith("/") ? path : path + "/";
      const res = await req(p);
      if (!res.ok) throw new Error("LIST " + p + " " + res.status);
      const body = await res.json();
      return {
        files: Array.isArray(body.files) ? body.files : [],
        subFolders: Array.isArray(body.subFolders) ? body.subFolders : [],
      };
    },
  };
}

export function cubePaths(cubeId) {
  const root = "/cubes/" + encodeURIComponent(cubeId);
  return { root, manifest: root + "/manifest.json" };
}

export function makeEnvelope(subject, payload, replyFile) {
  if (!subject) throw new Error("subject required");
  if (!payload || typeof payload !== "object") throw new Error("payload object required");
  return { subject, payload, reply_file: replyFile || undefined };
}

export async function enqueue(client, name, envelope) {
  const file = "/outbox/" + name + ".json";
  await client.writeJSON(file, envelope);
  return file;
}

export const SHARE_MODES = [
  { id: "A", title: "Proofs only", detail: "Blockchain + receipts. No metadata or files." },
  { id: "B", title: "Proofs + metadata", detail: "Adds selected object metadata." },
  { id: "C", title: "Proofs + metadata + files", detail: "Adds selected attachments." },
];

export function validateShare(mode, selectedHashes) {
  if (["A", "B", "C"].indexOf(mode) < 0) throw new Error("mode must be A, B, or C");
  if (!selectedHashes || !selectedHashes.length) throw new Error("select at least one object");
  return { mode, selected: selectedHashes.slice(), receipts_preserved: true };
}

export function createMemoryFetch() {
  const store = new Map();
  const fetchImpl = async (url, opts = {}) => {
    const path = url.replace(DATA_BASE, "") || "/";
    const method = (opts.method || "GET").toUpperCase();
    if (method === "PUT") {
      store.set(path, opts.body);
      return { ok: true, status: 200, json: async () => ({}) };
    }
    if (method === "GET") {
      if (store.has(path)) {
        const body = store.get(path);
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
      }
      if (path.endsWith("/")) {
        const prefix = path === "/" ? "/" : path;
        const files = [];
        const sub = new Set();
        for (const key of store.keys()) {
          if (!key.startsWith(prefix)) continue;
          const rest = key.slice(prefix.length);
          if (!rest) continue;
          const parts = rest.split("/").filter(Boolean);
          if (parts.length === 1) files.push(parts[0]);
          else if (parts.length > 1) sub.add(parts[0]);
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ files, subFolders: [...sub] }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: false, status: 400, json: async () => ({}) };
  };
  fetchImpl.store = store;
  return fetchImpl;
}
