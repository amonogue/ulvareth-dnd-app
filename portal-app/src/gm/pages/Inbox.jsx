import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "ulvareth_gm_inbox_v2";

function loadInbox() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveInbox(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}
function toCSV(rows) {
  if (!rows?.length) return "";
  const heads = Object.keys(rows[0]);
  let out = heads.join(",") + "\n";
  for (const r of rows) out += heads.map((h) => JSON.stringify(r[h] ?? "")).join(",") + "\n";
  return "\uFEFF" + out; // BOM for Excel-friendliness
}

export default function GMInbox() {
  const [items, setItems] = useState(() => loadInbox());
  const [q, setQ] = useState("");

  useEffect(() => {
    const onStorage = () => setItems(loadInbox());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const list = items.slice().sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((r) =>
      `${r.player} ${r.primary} ${r.secondary} ${r.SW_pct} ${r.SE_pct} ${r.SC_pct}`
        .toLowerCase()
        .includes(needle)
    );
  }, [items, q]);

  function remove(id) {
    const next = items.filter((x) => x.id !== id);
    setItems(next); saveInbox(next);
  }
  function clearAll() {
    if (!confirm("Clear the entire inbox?")) return;
    setItems([]); saveInbox([]);
  }
  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Ulvareth_Inbox.csv";
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
  }

  return (
    <div className="stack">
      <section className="card">
        <h1 className="m-0 text-xl font-bold text-swords">GM Inbox</h1>
        <p className="text-gray-600">Results arrive here when a player uses <b>Send to DM</b>.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, primary, secondary…"
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: "#C1CAD6", background: "#fff" }}
          />
          <button onClick={exportCSV} className="btn btn-ghost">Export CSV</button>
          <button onClick={clearAll} className="btn btn-danger">Clear All</button>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="card">
          <p className="text-gray-600 m-0">No items yet.</p>
        </section>
      ) : (
        <section className="stack">
          {filtered.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-swords">
                    {r.player || "Player"} &middot; {r.primary}/{r.secondary}
                  </div>
                  <div className="text-xs text-gray-600">{new Date(r.ts).toLocaleString()}</div>
                </div>
                <button className="btn btn-ghost" onClick={() => remove(r.id)}>Delete</button>
              </div>

              <div className="mt-2 grid sm:grid-cols-3 gap-2 text-sm">
                <div className="rounded-md p-2 text-white" style={{ background: "#3A6D8C" }}>
                  <div className="text-xs opacity-80">Swords</div>
                  <div className="text-lg font-semibold">{r.SW_pct}%</div>
                </div>
                <div className="rounded-md p-2 text-white" style={{ background: "#3D6B35" }}>
                  <div className="text-xs opacity-80">Seekers</div>
                  <div className="text-lg font-semibold">{r.SE_pct}%</div>
                </div>
                <div className="rounded-md p-2 text-white" style={{ background: "#5C3B6E" }}>
                  <div className="text-xs opacity-80">Schemers</div>
                  <div className="text-lg font-semibold">{r.SC_pct}%</div>
                </div>
              </div>

              {r.selections ? (
                <details className="mt-2">
                  <summary className="cursor-pointer">Raw answers</summary>
                  <pre className="mt-2 p-2 rounded-md bg-gray-100 overflow-auto text-xs">
{JSON.stringify(r.selections, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";

export default function Inbox() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("quiz_inbox") || "[]");
    setItems(data);
  }, []);

  function clearInbox() {
    if (!confirm("Clear all imported quiz results?")) return;
    localStorage.removeItem("quiz_inbox");
    setItems([]);
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <h1 style={{margin:0}}>Quiz Inbox</h1>
          <button onClick={clearInbox} className="btn btn-danger">Clear Inbox</button>
        </div>
        {!items.length && <p className="subtle">No results yet. Paste an import link in the address bar or use the Player app’s “Send to DM”.</p>}

        <div className="stack">
          {items.map((it, idx) => (
            <article key={idx} className="card">
              <div className="subtle" style={{fontSize:12, marginBottom:6}}>
                {new Date(it.ts || it.when || Date.now()).toLocaleString()}
              </div>

              <div className="grid grid-2">
                <div><b>Player:</b> {it.player || "Player"}</div>
                <div><b>Primary:</b> {it.primary}</div>
                <div><b>Secondary:</b> {it.secondary}</div>
              </div>

              <div className="grid grid-2" style={{marginTop:8}}>
                <div><b>SW:</b> {it.SW_pct ?? "-"}% ({it.SW_total ?? "-"})</div>
                <div><b>SE:</b> {it.SE_pct ?? "-"}% ({it.SE_total ?? "-"})</div>
                <div><b>SC:</b> {it.SC_pct ?? "-"}% ({it.SC_total ?? "-"})</div>
              </div>

              {it.selections && (
                <details style={{marginTop:10}}>
                  <summary className="btn btn-ghost" style={{display:'inline-flex'}}>Show raw answers</summary>
                  <pre style={{marginTop:10}}>{JSON.stringify(it.selections, null, 2)}</pre>
                </details>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
