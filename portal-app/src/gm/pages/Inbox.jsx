import React, { useEffect, useMemo, useState } from "react";

/** Lightweight helpers */
function safeDecodePayload(b64) {
  try {
    // base64 -> UTF-8 string -> JSON
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function toCSVRow(obj) {
  // Convert one payload into a flat CSV row compatible with Admin
  // Columns: Player,SW_total,SE_total,SC_total,Primary,Secondary,SW_pct,SE_pct,SC_pct
  const headers = [
    "Player",
    "SW_total",
    "SE_total",
    "SC_total",
    "Primary",
    "Secondary",
    "SW_pct",
    "SE_pct",
    "SC_pct",
  ];
  const row = {
    Player: obj?.player ?? "Player",
    SW_total: obj?.SW_total ?? "",
    SE_total: obj?.SE_total ?? "",
    SC_total: obj?.SC_total ?? "",
    Primary: obj?.primary ?? "",
    Secondary: obj?.secondary ?? "",
    SW_pct: obj?.SW_pct ?? "",
    SE_pct: obj?.SE_pct ?? "",
    SC_pct: obj?.SC_pct ?? "",
  };
  return headers.join(",") + "\n" + headers.map((h) => JSON.stringify(row[h] ?? "")).join(",") + "\n";
}

function useQueryParam(name) {
  const [val, setVal] = useState(() => new URL(window.location.href).searchParams.get(name));
  useEffect(() => {
    const onPop = () => setVal(new URL(window.location.href).searchParams.get(name));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [name]);
  return val;
}

export default function GMInbox() {
  const dataParam = useQueryParam("data");
  const [pasted, setPasted] = useState("");
  const [payload, setPayload] = useState(null); // decoded object
  const [error, setError] = useState("");

  // Try to decode from URL on load
  useEffect(() => {
    if (!dataParam) return;
    const decoded = safeDecodePayload(dataParam);
    if (decoded) {
      setPayload(decoded);
      setError("");
      // Clean the URL to avoid re-import when navigating
      const url = new URL(window.location.href);
      url.searchParams.delete("data");
      window.history.replaceState({}, "", url.toString());
    } else {
      setError("Could not decode data from URL.");
    }
  }, [dataParam]);

  // Also allow manual paste: either the full URL or just the base64
  function handleImport() {
    setError("");
    let val = (pasted || "").trim();
    if (!val) {
      setError("Paste a link or base64 payload first.");
      return;
    }
    // If user pasted a full link, extract ?data=... from it.
    try {
      if (val.startsWith("http://") || val.startsWith("https://")) {
        const u = new URL(val);
        const d = u.searchParams.get("data");
        if (d) val = d;
      }
    } catch (_) {
      // not a URL; assume it's base64
    }
    const decoded = safeDecodePayload(val);
    if (decoded) {
      setPayload(decoded);
      setPasted("");
    } else {
      setError("That didn’t look like a valid Ulvareth link/payload.");
    }
  }

  const csv = useMemo(() => (payload ? toCSVRow(payload) : ""), [payload]);

  async function copyCSV() {
    if (!csv) return;
    try {
      await navigator.clipboard.writeText("\uFEFF" + csv);
      alert("CSV row copied! Paste into a file or the Admin app.");
    } catch {
      alert("Could not copy. Select the text manually.");
    }
  }

  function goToAdmin() {
    // Jump to GM Admin inside the portal
    window.location.hash = "#/gm/admin";
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:p-8" style={{ background: "#E6E1D3", color: "#2F2F2F" }}>
      <div className="max-w-3xl mx-auto grid gap-4">
        <header className="mb-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "#3A6D8C" }}>
            GM Inbox
          </h1>
          <p className="text-sm opacity-80">
            Drop a Player link here or open a Player-generated link with <code>?data=…</code>. You’ll see a preview and can send it on to Admin.
          </p>
        </header>

        {/* Paste/import panel */}
        <section className="rounded-2xl border p-4" style={{ background: "#C1CAD6", borderColor: "#9A9A9A" }}>
          <label className="text-sm block mb-2">Paste Player link or payload</label>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.currentTarget.value)}
            placeholder="https://amonogue.github.io/ulvareth-dnd-app/#/quiz?data=...  OR  eyJ0cyI6IjIwMjUtMDkt..."
            className="w-full rounded-xl border p-3 text-sm"
            rows={3}
            style={{ borderColor: "#9A9A9A", background: "#fff" }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-xl text-white"
              style={{ background: "#3A6D8C" }}
            >
              Import
            </button>
            <button
              onClick={() => {
                setPasted("");
                setPayload(null);
                setError("");
              }}
              className="px-4 py-2 rounded-xl border"
              style={{ borderColor: "#9A9A9A", background: "#fff" }}
            >
              Clear
            </button>
          </div>
          {!!error && <p className="mt-2 text-sm" style={{ color: "#B6402C" }}>Error: {error}</p>}
        </section>

        {/* Preview panel */}
        {!payload ? (
          <section className="rounded-2xl border p-4" style={{ background: "#C1CAD6", borderColor: "#9A9A9A" }}>
            <p className="text-sm opacity-80">
              Waiting for a link… Ask a player to click <b>Send to DM</b> in the quiz, or paste the link they share here.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border p-4 space-y-3" style={{ background: "#C1CAD6", borderColor: "#9A9A9A" }}>
            <h2 className="text-lg font-semibold" style={{ color: "#3A6D8C" }}>
              Incoming Player
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-3 border bg-white" style={{ borderColor: "#9A9A9A" }}>
                <div className="text-sm opacity-70">Name</div>
                <div className="font-semibold">{payload.player || "Player"}</div>
              </div>
              <div className="rounded-xl p-3 border bg-white" style={{ borderColor: "#9A9A9A" }}>
                <div className="text-sm opacity-70">Primary</div>
                <div className="font-semibold">{payload.primary || "-"}</div>
              </div>
              <div className="rounded-xl p-3 border bg-white" style={{ borderColor: "#9A9A9A" }}>
                <div className="text-sm opacity-70">Secondary</div>
                <div className="font-semibold">{payload.secondary || "-"}</div>
              </div>
              <div className="rounded-xl p-3 border bg-white" style={{ borderColor: "#9A9A9A" }}>
                <div className="text-sm opacity-70">Totals (SW / SE / SC)</div>
                <div className="font-semibold">
                  {payload.SW_total ?? 0} / {payload.SE_total ?? 0} / {payload.SC_total ?? 0}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={copyCSV} className="px-4 py-2 rounded-xl text-white" style={{ background: "#3A6D8C" }}>
                Copy CSV Row
              </button>
              <button onClick={goToAdmin} className="px-4 py-2 rounded-xl text-white" style={{ background: "#3D6B35" }}>
                Open Admin
              </button>
            </div>

            {/* Advanced: show raw CSV row for copy-by-selection */}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">Show CSV preview</summary>
              <pre className="mt-2 p-3 rounded-xl border bg-white overflow-auto text-xs" style={{ borderColor: "#9A9A9A" }}>
{csv}
              </pre>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
