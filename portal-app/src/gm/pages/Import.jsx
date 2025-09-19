import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LS_KEY = "ulvareth_gm_inbox_v2";

function saveToInbox(record) {
  const id = record.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry = { ...record, id };
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = [entry, ...arr].slice(0, 500);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return id;
  } catch {
    return null;
  }
}
function decodeDataParam(search) {
  const match = new URLSearchParams(search).get("data");
  if (!match) return { ok: false, err: "No data parameter found." };
  try {
    const json = decodeURIComponent(escape(atob(match)));
    const obj = JSON.parse(json);
    return { ok: true, obj };
  } catch (e) {
    return { ok: false, err: "Could not decode data parameter." };
  }
}

export default function GMImport() {
  const loc = useLocation();
  const nav = useNavigate();
  const [manual, setManual] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const fromQuery = useMemo(() => decodeDataParam(loc.search), [loc.search]);

  // If ?data= is present, auto-preview it
  useEffect(() => {
    if (fromQuery.ok) {
      setPreview(fromQuery.obj);
      setError("");
    } else if (loc.search) {
      setError(fromQuery.err || "Unknown error.");
      setPreview(null);
    }
  }, [fromQuery, loc.search]);

  function tryParseManual() {
    const trimmed = manual.trim();
    if (!trimmed) return setError("Paste a full link with ?data=… or a base64 payload.");
    // Accept either the entire URL or just the base64
    let payload = trimmed;
    const idx = trimmed.indexOf("data=");
    if (idx >= 0) payload = trimmed.slice(idx + 5);
    const res = decodeDataParam("?data=" + payload);
    if (!res.ok) { setError(res.err || "Could not decode."); setPreview(null); return; }
    setPreview(res.obj); setError("");
  }

  function save() {
    if (!preview) { setError("Nothing to save."); return; }
    // Normalize into an inbox record
    const base = preview || {};
    const rec = {
      id: base.id || undefined,
      ts: base.ts || new Date().toISOString(),
      source: base.source || "import",
      player: base.player || "Player",
      primary: base.primary || "—",
      secondary: base.secondary || "—",
      SW_total: base.SW_total ?? null,
      SE_total: base.SE_total ?? null,
      SC_total: base.SC_total ?? null,
      SW_pct: base.SW_pct ?? null,
      SE_pct: base.SE_pct ?? null,
      SC_pct: base.SC_pct ?? null,
      selections: base.selections || null,
    };
    const id = saveToInbox(rec);
    if (!id) { setError("Could not save to inbox."); return; }
    nav("/gm/inbox");
  }

  return (
    <div className="stack">
      <section className="card">
        <h1 className="m-0 text-xl font-bold text-swords">Import Player Result</h1>
        <p className="text-gray-600">
          Paste a link from the Player quiz (<b>Send to DM</b>) or open the portal link directly.
        </p>

        <div className="mt-3 grid gap-2">
          <textarea
            rows={3}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste full link (…#/gm/import?data=BASE64) or just the BASE64 payload"
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: "#C1CAD6", background: "#fff" }}
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={tryParseManual}>Preview</button>
            <button className="btn btn-primary" onClick={save} disabled={!preview}>Save to Inbox</button>
          </div>
        </div>

        {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
      </section>

      {preview && (
        <section className="card">
          <h2 className="m-0 text-lg font-semibold">Preview</h2>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            <div>
              <div><b>Player:</b> {preview.player || "Player"}</div>
              <div><b>Primary:</b> {preview.primary} &middot; <b>Secondary:</b> {preview.secondary}</div>
              <div className="text-sm text-gray-600">{new Date(preview.ts || Date.now()).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md p-2 text-white" style={{ background: "#3A6D8C" }}>
                <div className="text-xs opacity-80">Swords</div>
                <div className="text-lg font-semibold">{preview.SW_pct ?? "—"}%</div>
              </div>
              <div className="rounded-md p-2 text-white" style={{ background: "#3D6B35" }}>
                <div className="text-xs opacity-80">Seekers</div>
                <div className="text-lg font-semibold">{preview.SE_pct ?? "—"}%</div>
              </div>
              <div className="rounded-md p-2 text-white" style={{ background: "#5C3B6E" }}>
                <div className="text-xs opacity-80">Schemers</div>
                <div className="text-lg font-semibold">{preview.SC_pct ?? "—"}%</div>
              </div>
            </div>
          </div>

          {preview.selections ? (
            <details className="mt-3">
              <summary className="cursor-pointer">Raw answers</summary>
              <pre className="mt-2 p-2 rounded-md bg-gray-100 overflow-auto text-xs">
{JSON.stringify(preview.selections, null, 2)}
              </pre>
            </details>
          ) : null}
        </section>
      )}
    </div>
  );
}
