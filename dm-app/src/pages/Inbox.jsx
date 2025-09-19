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
