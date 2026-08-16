window.VeraeSDK = (function () {
  const DATA_BASE = "/peergos-api/v0/data";
  function createClient(fetchImpl, base) {
    const f = fetchImpl || fetch.bind(globalThis);
    base = base || DATA_BASE;
    async function req(path, opts) {
      return f(base + path, opts || {});
    }
    return {
      async writeJSON(path, obj) {
        const res = await req(path, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(obj),
        });
        if (!res.ok) throw new Error("PUT " + path + " " + res.status);
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
        return { files: body.files || [], subFolders: body.subFolders || [] };
      },
    };
  }
  function cubePaths(cubeId) {
    const root = "/cubes/" + encodeURIComponent(cubeId);
    return { root, manifest: root + "/manifest.json" };
  }
  function makeEnvelope(subject, payload, replyFile) {
    return { subject, payload, reply_file: replyFile };
  }
  function enqueue(client, name, envelope) {
    return client.writeJSON("/outbox/" + name + ".json", envelope);
  }
  const SHARE_MODES = [
    { id: "A", title: "Proofs only", detail: "Blockchain + receipts. No metadata or files." },
    { id: "B", title: "Proofs + metadata", detail: "Adds selected object metadata." },
    { id: "C", title: "Proofs + metadata + files", detail: "Adds selected attachments." },
  ];
  function validateShare(mode, selectedHashes) {
    if (["A", "B", "C"].indexOf(mode) < 0) throw new Error("mode must be A, B, or C");
    if (!selectedHashes || !selectedHashes.length) throw new Error("select at least one object");
    return { mode, selected: selectedHashes.slice(), receipts_preserved: true };
  }
  return { createClient, cubePaths, makeEnvelope, enqueue, SHARE_MODES, validateShare };
})();
